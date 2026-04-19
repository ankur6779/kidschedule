import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  getEntitlements,
  getOrCreateSubscription,
  startTrial,
  activateSubscription,
  PLAN_PRICES,
  type Plan,
} from "../services/subscriptionService";
import { requireAuth } from "../middlewares/requireAuth";
import {
  createSubscription as rzpCreateSubscription,
  fetchSubscription as rzpFetchSubscription,
  verifySubscriptionPaymentSignature,
  verifyWebhookSignature,
  razorpayConfigured,
  planEnv as rzpPlanEnv,
  razorpayPlanIdToPlan,
  TOTAL_COUNT_BY_PLAN,
} from "../lib/razorpayClient";

// Map RevenueCat product/store identifiers back to our internal Plan code so
// that webhook events can update the local subscription record.
function productIdToPlan(productId: string | undefined | null): Exclude<Plan, "free"> | null {
  if (!productId) return null;
  if (productId.startsWith("amynest_monthly")) return "monthly";
  if (productId.startsWith("amynest_6month")) return "six_month";
  if (productId.startsWith("amynest_yearly")) return "yearly";
  return null;
}

const router: IRouter = Router();

router.get("/subscription", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const ent = await getEntitlements(userId);
  res.json({
    entitlements: ent,
    plans: [
      {
        id: "monthly" as Plan,
        title: "Monthly",
        price: PLAN_PRICES.monthly.amount,
        currency: "INR",
        period: PLAN_PRICES.monthly.period,
        badge: null,
        features: [
          "Unlimited Amy AI",
          "Personalized Amy Coach",
          "Unlimited routines & children",
          "Full Parenting Hub",
        ],
      },
      {
        id: "six_month" as Plan,
        title: "6 Months",
        price: PLAN_PRICES.six_month.amount,
        currency: "INR",
        period: PLAN_PRICES.six_month.period,
        badge: "Most Popular",
        savingsPercent: Math.round(
          (1 - PLAN_PRICES.six_month.amount / (PLAN_PRICES.monthly.amount * 6)) * 100,
        ),
        features: [
          "Everything in Monthly",
          "Behavior insights & trends",
          "Save vs monthly billing",
        ],
      },
      {
        id: "yearly" as Plan,
        title: "Yearly",
        price: PLAN_PRICES.yearly.amount,
        currency: "INR",
        period: PLAN_PRICES.yearly.period,
        badge: "Best Value",
        savingsPercent: Math.round(
          (1 - PLAN_PRICES.yearly.amount / (PLAN_PRICES.monthly.amount * 12)) * 100,
        ),
        features: [
          "Everything in 6 Months",
          "Adaptive learning",
          "Priority support",
        ],
      },
    ],
  });
});

router.post("/subscription/start-trial", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  await startTrial(userId);
  const ent = await getEntitlements(userId);
  res.json({ entitlements: ent });
});

/**
 * RevenueCat config — clients call this to discover the offering / entitlement
 * identifier and the user identifier they should pass to Purchases.logIn().
 * The actual checkout happens client-side via the RevenueCat SDK.
 */
router.get("/subscription/rc-config", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({
    provider: "revenuecat",
    entitlementId: process.env.REVENUECAT_ENTITLEMENT_ID ?? "premium",
    offeringId: "default",
    appUserId: userId,
    packageMap: {
      monthly: "$rc_monthly",
      six_month: "$rc_six_month",
      yearly: "$rc_annual",
    },
  });
});

/**
 * Legacy endpoint — kept for the web client which still posts here. Returns
 * 200 with rc-config payload so the web client can hand-off to RevenueCat.
 * Mobile clients should call /subscription/rc-config directly.
 */
router.post("/subscription/checkout", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({
    provider: "revenuecat",
    entitlementId: process.env.REVENUECAT_ENTITLEMENT_ID ?? "premium",
    offeringId: "default",
    appUserId: userId,
    packageMap: {
      monthly: "$rc_monthly",
      six_month: "$rc_six_month",
      yearly: "$rc_annual",
    },
  });
});

/**
 * RevenueCat webhook — invoked by RevenueCat on subscription lifecycle events
 * (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, etc.). We use it as
 * the source of truth for activating/expiring the local subscription record.
 *
 * Authenticated via shared bearer token (REVENUECAT_WEBHOOK_SECRET).
 */
router.post("/subscription/webhook", async (req, res): Promise<void> => {
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "webhook_secret_unconfigured" });
      return;
    }
    // dev/test: allow unauthenticated calls so we can exercise the flow locally
  } else {
    const auth = req.headers["authorization"];
    if (auth !== `Bearer ${expected}`) {
      res.status(401).json({ error: "invalid_webhook_signature" });
      return;
    }
  }

  const event = (req.body?.event ?? {}) as {
    type?: string;
    app_user_id?: string;
    original_app_user_id?: string;
    product_id?: string;
    expiration_at_ms?: number;
    transaction_id?: string;
  };

  const userId = event.app_user_id ?? event.original_app_user_id;
  if (!userId) {
    res.status(400).json({ error: "missing_app_user_id" });
    return;
  }

  const plan = productIdToPlan(event.product_id);
  const periodEnd = event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined;

  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "PRODUCT_CHANGE":
    case "UNCANCELLATION": {
      if (!plan) {
        res.status(200).json({ ok: true, ignored: "unknown_plan", productId: event.product_id });
        return;
      }
      await activateSubscription(userId, plan, {
        provider: "revenuecat",
        periodEnd,
        providerCustomerId: userId,
        providerSubscriptionId: event.transaction_id,
      });
      res.json({ ok: true, applied: { userId, plan } });
      return;
    }
    case "CANCELLATION":
    case "EXPIRATION":
    case "BILLING_ISSUE": {
      // Mark canceled but keep period_end so client can show "active until ___".
      // The entitlements helper checks isPremiumNow against current_period_end.
      const { db, subscriptionsTable } = await import("@workspace/db");
      const { eq } = await import("drizzle-orm");
      await db.update(subscriptionsTable).set({
        status: event.type === "BILLING_ISSUE" ? "past_due" : "canceled",
        currentPeriodEnd: periodEnd ?? null,
        updatedAt: new Date(),
      }).where(eq(subscriptionsTable.userId, userId));
      res.json({ ok: true, applied: { userId, status: event.type } });
      return;
    }
    default:
      res.json({ ok: true, ignored: event.type });
      return;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay (web + Android only — iOS keeps RevenueCat / Apple IAP)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /subscription/razorpay/config — public-safe values the client needs to
 * launch Razorpay Checkout. Requires auth so we can echo the user's id.
 */
router.get("/subscription/razorpay/config", requireAuth, (req, res): void => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({
    enabled: razorpayConfigured(),
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    plansConfigured: {
      monthly: !!process.env.RAZORPAY_PLAN_ID_MONTHLY,
      six_month: !!process.env.RAZORPAY_PLAN_ID_SIX_MONTH,
      yearly: !!process.env.RAZORPAY_PLAN_ID_YEARLY,
    },
  });
});

/**
 * POST /subscription/razorpay/create-subscription
 * Body: { plan: "monthly" | "six_month" | "yearly" }
 * Returns: { subscriptionId, keyId, plan, amount, currency }
 */
router.post(
  "/subscription/razorpay/create-subscription",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!razorpayConfigured()) {
      res.status(503).json({ error: "razorpay_not_configured" });
      return;
    }
    const plan = req.body?.plan as Exclude<Plan, "free"> | undefined;
    if (plan !== "monthly" && plan !== "six_month" && plan !== "yearly") {
      res.status(400).json({ error: "invalid_plan" });
      return;
    }
    const env = rzpPlanEnv();
    const planId = env[plan];
    if (!planId) {
      res.status(503).json({ error: `plan_id_unconfigured_${plan}` });
      return;
    }
    try {
      const sub = await rzpCreateSubscription({
        planId,
        totalCount: TOTAL_COUNT_BY_PLAN[plan],
        notes: { userId, internalPlan: plan },
      });
      res.json({
        subscriptionId: sub.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan,
        amount: PLAN_PRICES[plan].amount,
        currency: "INR",
      });
    } catch (err: any) {
      res.status(502).json({ error: "razorpay_create_failed", message: err?.message });
    }
  },
);

/**
 * POST /subscription/razorpay/verify
 * Body: { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan }
 *
 * Verifies the Checkout HMAC signature, then enforces ownership
 * (sub.notes.userId === auth user) and plan binding against the
 * Razorpay subscription record. On success it persists ONLY the
 * provider linkage (provider, providerSubscriptionId) — it does NOT
 * flip status to "active". Activation happens exclusively in the
 * webhook handler when `subscription.activated` / `.charged` /
 * `.resumed` arrives, which is the canonical confirmation that the
 * first charge actually succeeded. The client should poll
 * `/api/subscription` (or refresh on the
 * `amynest:refresh-subscription` event) until the webhook lands.
 */
router.post(
  "/subscription/razorpay/verify",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId;
    if (!userId) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const {
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature,
      plan,
    } = req.body ?? {};
    if (!paymentId || !subscriptionId || !signature) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }
    const ok = verifySubscriptionPaymentSignature({
      paymentId,
      subscriptionId,
      signature,
    });
    if (!ok) {
      res.status(401).json({ error: "invalid_signature" });
      return;
    }
    const planFromBody = (plan === "monthly" || plan === "six_month" || plan === "yearly")
      ? (plan as Exclude<Plan, "free">)
      : null;
    if (!planFromBody) {
      res.status(400).json({ error: "invalid_plan" });
      return;
    }

    // Fetch the subscription from Razorpay so we can verify ownership and the
    // plan binding server-side. Without this an attacker who captured ANY
    // valid {payment_id, subscription_id, signature} tuple from another
    // account could replay it to grant their own account premium access.
    let sub: Awaited<ReturnType<typeof rzpFetchSubscription>>;
    try {
      sub = await rzpFetchSubscription(subscriptionId);
    } catch (err: any) {
      res.status(502).json({ error: "razorpay_fetch_failed", message: err?.message });
      return;
    }

    const ownerUserId = (sub.notes as Record<string, unknown> | undefined)?.userId;
    if (typeof ownerUserId !== "string" || ownerUserId !== userId) {
      // Either the subscription wasn't created by us, or it belongs to a
      // different account. Refuse to grant premium. This is the key
      // anti-replay / anti-cross-account check.
      res.status(403).json({ error: "subscription_owner_mismatch" });
      return;
    }

    const planFromSub = razorpayPlanIdToPlan(sub.plan_id);
    if (!planFromSub || planFromSub !== planFromBody) {
      res.status(400).json({ error: "plan_mismatch" });
      return;
    }
    const planCode = planFromSub;

    // Persist provider linkage ONLY (intent). We do NOT flip status to
    // "active" here — the webhook (`subscription.activated` /
    // `subscription.charged`) is the canonical source of truth for the
    // first successful charge. The client should poll `/api/subscription`
    // (or refresh on the `amynest:refresh-subscription` event) until the
    // webhook lands, which usually takes a few seconds.
    const { db, subscriptionsTable } = await import("@workspace/db");
    await getOrCreateSubscription(userId);
    await db
      .update(subscriptionsTable)
      .set({
        provider: "razorpay",
        providerCustomerId: userId,
        providerSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.userId, userId));

    const ent = await getEntitlements(userId);
    res.json({
      ok: true,
      pending: true,
      message: "payment_verified_awaiting_webhook",
      plan: planCode,
      entitlements: ent,
    });
  },
);

/**
 * POST /subscription/razorpay/webhook — Razorpay subscription lifecycle.
 * MUST be mounted before requireAuth (it is — see routes/index.ts). Verifies
 * X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET and is idempotent on
 * event id (same event arriving twice is safe).
 */
const seenEventIds = new Set<string>();
function markEventSeen(eventId: string): void {
  seenEventIds.add(eventId);
  if (seenEventIds.size > 5000) {
    // Drop the oldest ~half by re-creating the set from a slice.
    const arr = Array.from(seenEventIds).slice(-2500);
    seenEventIds.clear();
    arr.forEach((id) => seenEventIds.add(id));
  }
}
router.post("/subscription/razorpay/webhook", async (req, res): Promise<void> => {
  // Razorpay always POSTs JSON. Reject anything else so the rawBody hook
  // (which is keyed off application/json) is guaranteed to have run.
  const ct = (req.headers["content-type"] ?? "").toString().toLowerCase();
  if (!ct.includes("application/json")) {
    res.status(415).json({ error: "unsupported_media_type" });
    return;
  }

  const expected = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "webhook_secret_unconfigured" });
      return;
    }
    // dev/test allows unauthenticated calls so we can exercise locally.
  } else {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const rawBody: string | undefined = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ error: "missing_raw_body" });
      return;
    }
    if (!verifyWebhookSignature(rawBody, signature, expected)) {
      res.status(401).json({ error: "invalid_signature" });
      return;
    }
  }

  const body = req.body ?? {};
  const eventId: string | undefined = body.id;
  const eventType: string | undefined = body.event;
  const sub = body.payload?.subscription?.entity as
    | {
        id?: string;
        plan_id?: string;
        notes?: Record<string, string>;
        current_end?: number | null;
        current_start?: number | null;
        status?: string;
      }
    | undefined;

  // Idempotency: short-circuit if we've already processed this event id.
  // We only ADD to the set AFTER the handler succeeds (see end of try
  // block) so a transient failure doesn't permanently drop a Razorpay
  // retry. The set is bounded to avoid unbounded memory growth.
  if (eventId && seenEventIds.has(eventId)) {
    res.json({ ok: true, duplicate: true });
    return;
  }

  if (!sub) {
    if (eventId) markEventSeen(eventId);
    res.json({ ok: true, ignored: "no_subscription_payload", eventType });
    return;
  }

  const userId = sub.notes?.userId;
  const plan = razorpayPlanIdToPlan(sub.plan_id);
  const periodEnd = sub.current_end ? new Date(sub.current_end * 1000) : undefined;

  if (!userId) {
    if (eventId) markEventSeen(eventId);
    res.json({ ok: true, ignored: "no_user_id_in_notes", eventType });
    return;
  }

  try {
    switch (eventType) {
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.resumed": {
        // Note: subscription.authenticated fires when the mandate is
        // approved but the first payment has NOT yet been captured. We
        // deliberately do NOT activate on that event — wait for
        // `.activated` / `.charged` / `.resumed`.
        if (!plan) {
          if (eventId) markEventSeen(eventId);
          res.json({ ok: true, ignored: "unknown_plan", planId: sub.plan_id });
          return;
        }
        await activateSubscription(userId, plan, {
          provider: "razorpay",
          periodEnd,
          providerCustomerId: userId,
          providerSubscriptionId: sub.id,
        });
        if (eventId) markEventSeen(eventId);
        res.json({ ok: true, applied: { userId, plan, eventType } });
        return;
      }
      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.expired":
      case "subscription.paused":
      case "subscription.halted": {
        const { db, subscriptionsTable } = await import("@workspace/db");
        await db
          .update(subscriptionsTable)
          .set({
            status: eventType === "subscription.halted" ? "past_due" : "canceled",
            currentPeriodEnd: periodEnd ?? null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.userId, userId));
        if (eventId) markEventSeen(eventId);
        res.json({ ok: true, applied: { userId, status: eventType } });
        return;
      }
      default: {
        if (eventId) markEventSeen(eventId);
        res.json({ ok: true, ignored: eventType });
        return;
      }
    }
  } catch (err: any) {
    // Surface failures with a 5xx so Razorpay retries the webhook with
    // exponential backoff. We deliberately did NOT add the eventId to
    // seenEventIds, so the retry will go through this branch again.
    req.log?.error?.({ err, eventId, eventType }, "razorpay_webhook_failed");
    res.status(500).json({ error: "webhook_processing_failed", message: err?.message });
    return;
  }
});

export default router;
