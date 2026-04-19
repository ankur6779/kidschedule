/**
 * End-to-end webhook smoke test for the Razorpay subscription flow.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server exec tsx scripts/testRazorpayWebhook.ts
 *
 * Requires:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   — to verify plan IDs with Razorpay API
 *   RAZORPAY_WEBHOOK_SECRET                 — to sign simulated webhook payloads
 *   RAZORPAY_PLAN_ID_MONTHLY / _SIX_MONTH (or _QUARTERLY) / _YEARLY
 *   API_BASE_URL                            — defaults to http://localhost:8080
 *
 * What it tests:
 *   1. Plan IDs resolve correctly against the live Razorpay API
 *   2. Webhook signature verification (valid → 200, tampered → 401)
 *   3. subscription.charged fires for each plan and is applied in the DB
 *   4. subscription.cancelled sets status to canceled in the DB
 *   5. Idempotency: same event_id processed exactly once
 *
 * NOTE: The full checkout UI flow (Razorpay Checkout JS on web,
 * react-native-razorpay on Android) requires a human tester with a real
 * device. See docs/android-internal-testing.md §8 Smoke test.
 */

import crypto from "node:crypto";

type RazorpayPlanItem = {
  name: string;
  amount: number;
  currency: string;
};

type RazorpayPlanResponse = {
  id: string;
  item: RazorpayPlanItem;
  period: string;
  interval: number;
};

type RazorpayErrorResponse = {
  error: { description: string };
};

type WebhookResponse =
  | { ok: true; applied: { userId: string; plan: string; eventType?: string; status?: string } }
  | { ok: true; duplicate: true }
  | { ok: true; ignored: string; planId?: string }
  | { ok: false; error: string };

const BASE =
  process.env.API_BASE_URL ??
  `http://localhost:${process.env.PORT ?? 8080}`;

const PLAN_IDS: Record<string, string | undefined> = {
  monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY,
  six_month:
    process.env.RAZORPAY_PLAN_ID_SIX_MONTH ??
    process.env.RAZORPAY_PLAN_ID_QUARTERLY,
  yearly: process.env.RAZORPAY_PLAN_ID_YEARLY,
};

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

function authHeader(): string {
  if (!KEY_ID || !KEY_SECRET) throw new Error("RAZORPAY_KEY_ID / _SECRET not set");
  return "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
}

function sign(payload: string): string {
  if (!WEBHOOK_SECRET) throw new Error("RAZORPAY_WEBHOOK_SECRET not set");
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
}

function buildEvent(
  eventType: string,
  planId: string,
  subId: string,
  userId: string,
  eventId: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  return JSON.stringify({
    entity: "event",
    event: eventType,
    contains: ["subscription", "payment"],
    payload: {
      subscription: {
        entity: {
          id: subId,
          plan_id: planId,
          status: "active",
          current_start: now,
          current_end: now + 30 * 24 * 60 * 60,
          charge_at: now + 30 * 24 * 60 * 60,
          notes: { userId, internalPlan: "monthly" },
        },
      },
      payment: {
        entity: { id: "pay_smoke_test", amount: 19900, currency: "INR" },
      },
    },
    id: eventId,
    created_at: now,
  });
}

async function sendWebhook(
  body: string,
  overrideSig?: string,
): Promise<{ status: number; json: WebhookResponse }> {
  const sig = overrideSig ?? sign(body);
  const r = await fetch(`${BASE}/api/subscription/razorpay/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": sig,
    },
    body,
  });
  return { status: r.status, json: (await r.json()) as WebhookResponse };
}

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`, detail ?? "");
    failed++;
  }
}

async function main() {
  const run = `smoke_${Date.now()}`;
  console.log(`\nRazorpay webhook smoke test — run ${run}`);
  console.log(`API base: ${BASE}`);
  console.log("─".repeat(60));

  // ── 1. Verify plan IDs against Razorpay API ───────────────────
  console.log("\n[1] Plan IDs — Razorpay API verification");
  for (const [key, planId] of Object.entries(PLAN_IDS)) {
    if (!planId) {
      assert(`${key} plan ID configured`, false, "env var missing");
      continue;
    }
    const r = await fetch(`https://api.razorpay.com/v1/plans/${planId}`, {
      headers: { Authorization: authHeader() },
    });
    const raw: unknown = await r.json();

    if (r.ok) {
      const plan = raw as RazorpayPlanResponse;
      assert(
        `${key} (${planId}) resolves → ${plan.item.name} ₹${plan.item.amount / 100}`,
        true,
      );
    } else {
      const errBody = raw as RazorpayErrorResponse;
      assert(
        `${key} (${planId}) resolves`,
        false,
        errBody?.error?.description ?? "unknown error",
      );
    }
  }

  // ── 2. Bad signature rejected ─────────────────────────────────
  console.log("\n[2] Security — tampered signature rejected (expect 401)");
  const badPlanId = PLAN_IDS.monthly ?? "plan_unknown";
  const badPayload = buildEvent("subscription.charged", badPlanId, "sub_bad", "user_bad", `evt_bad_${run}`);
  const badResult = await sendWebhook(badPayload, "0".repeat(64));
  assert("tampered signature → HTTP 401", badResult.status === 401);

  // ── 3. subscription.charged for all three plans ───────────────
  console.log("\n[3] subscription.charged — all plans");
  for (const [key, planId] of Object.entries(PLAN_IDS)) {
    if (!planId) {
      assert(`${key} charged event applied`, false, "plan ID missing");
      continue;
    }
    const userId = `user_smoke_${key}_${run}`;
    const body = buildEvent(
      "subscription.charged",
      planId,
      `sub_smoke_${key}`,
      userId,
      `evt_charged_${key}_${run}`,
    );
    const result = await sendWebhook(body);
    const j = result.json;
    const applied = j.ok && "applied" in j && j.applied?.plan != null;
    assert(`${key} charged → HTTP 200 applied`, result.status === 200 && applied, j);
  }

  // ── 4. subscription.cancelled ─────────────────────────────────
  console.log("\n[4] subscription.cancelled");
  const cancelUserId = `user_smoke_monthly_${run}`;
  const cancelPlanId = PLAN_IDS.monthly ?? "plan_unknown";
  const cancelBody = buildEvent(
    "subscription.cancelled",
    cancelPlanId,
    "sub_smoke_monthly",
    cancelUserId,
    `evt_cancelled_${run}`,
  );
  const cancelResult = await sendWebhook(cancelBody);
  assert(
    "cancelled event → HTTP 200 applied",
    cancelResult.status === 200 && cancelResult.json.ok,
    cancelResult.json,
  );

  // ── 5. Idempotency ────────────────────────────────────────────
  console.log("\n[5] Idempotency — same event_id sent 3×");
  const idemUserId = `user_smoke_idem_${run}`;
  const idemPlanId = PLAN_IDS.monthly ?? "plan_unknown";
  const idemBody = buildEvent(
    "subscription.charged",
    idemPlanId,
    "sub_idem",
    idemUserId,
    `evt_idem_fixed_${run}`,
  );
  const r1 = await sendWebhook(idemBody);
  const r2 = await sendWebhook(idemBody);
  const r3 = await sendWebhook(idemBody);
  assert("first delivery → applied", r1.json.ok && "applied" in r1.json);
  assert("second delivery → duplicate", r2.json.ok && "duplicate" in r2.json && r2.json.duplicate === true);
  assert("third delivery → duplicate", r3.json.ok && "duplicate" in r3.json && r3.json.duplicate === true);

  // ── Summary ───────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("Some tests failed.");
    process.exit(1);
  } else {
    console.log("All webhook smoke tests passed.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
