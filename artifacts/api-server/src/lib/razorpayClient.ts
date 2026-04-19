// Razorpay REST API wrapper. Uses HTTP Basic Auth with
// RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET. Kept dependency-free to avoid
// pulling in the official Node SDK.
import crypto from "node:crypto";

const BASE_URL = "https://api.razorpay.com/v1";

export class RazorpayConfigError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "RazorpayConfigError";
  }
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) {
    throw new RazorpayConfigError(
      "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured",
    );
  }
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function rzp<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    const desc = json?.error?.description ?? text ?? res.statusText;
    throw new Error(`razorpay ${method} ${path} -> ${res.status}: ${desc}`);
  }
  return json as T;
}

// ── Plans ──
export type RazorpayPlan = {
  id: string;
  entity: "plan";
  interval: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  item: { name: string; amount: number; currency: string };
};

export async function createPlan(opts: {
  period: "monthly" | "yearly";
  interval: number;
  amountPaise: number;
  currency?: string;
  name: string;
  description?: string;
}): Promise<RazorpayPlan> {
  return rzp<RazorpayPlan>("POST", "/plans", {
    period: opts.period,
    interval: opts.interval,
    item: {
      name: opts.name,
      amount: opts.amountPaise,
      currency: opts.currency ?? "INR",
      description: opts.description ?? opts.name,
    },
  });
}

export async function listPlans(count = 100): Promise<{ items: RazorpayPlan[] }> {
  return rzp<{ items: RazorpayPlan[] }>("GET", `/plans?count=${count}`);
}

// ── Subscriptions ──
export type RazorpaySubscription = {
  id: string;
  entity: "subscription";
  plan_id: string;
  status:
    | "created"
    | "authenticated"
    | "active"
    | "pending"
    | "halted"
    | "cancelled"
    | "completed"
    | "expired"
    | "paused";
  current_start: number | null;
  current_end: number | null;
  charge_at: number | null;
  total_count: number;
  notes?: Record<string, string>;
};

export async function createSubscription(opts: {
  planId: string;
  totalCount: number;
  customerNotify?: 0 | 1;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscription> {
  return rzp<RazorpaySubscription>("POST", "/subscriptions", {
    plan_id: opts.planId,
    total_count: opts.totalCount,
    customer_notify: opts.customerNotify ?? 1,
    notes: opts.notes,
  });
}

export async function fetchSubscription(id: string): Promise<RazorpaySubscription> {
  return rzp<RazorpaySubscription>("GET", `/subscriptions/${encodeURIComponent(id)}`);
}

export async function cancelSubscription(
  id: string,
  cancelAtCycleEnd = true,
): Promise<RazorpaySubscription> {
  return rzp<RazorpaySubscription>(
    "POST",
    `/subscriptions/${encodeURIComponent(id)}/cancel`,
    { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 },
  );
}

// ── Signature verification ──

/** Verifies the HMAC-SHA256 signature returned by Checkout.js after a
 *  successful subscription payment. */
export function verifySubscriptionPaymentSignature(opts: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const payload = `${opts.paymentId}|${opts.subscriptionId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return timingSafeEq(expected, opts.signature);
}

/** Verifies the X-Razorpay-Signature header on incoming webhook bodies.
 *  `rawBody` MUST be the raw request bytes (or string), not the parsed JSON. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | undefined,
  secret = process.env.RAZORPAY_WEBHOOK_SECRET,
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEq(expected, signature);
}

function timingSafeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function razorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Reads the env-configured Razorpay plan IDs.
 *
 *  The 6-month plan can be supplied under either of two env var names:
 *    - RAZORPAY_PLAN_ID_SIX_MONTH  — canonical (preferred, set by seedRazorpay.ts)
 *    - RAZORPAY_PLAN_ID_QUARTERLY  — accepted alias (Razorpay dashboard sometimes
 *                                    labels a 6-month plan as "quarterly")
 *  Both names refer to the same billing plan (₹999 / 6 months, monthly×6).
 */
export function planEnv(): {
  monthly: string | undefined;
  six_month: string | undefined;
  yearly: string | undefined;
} {
  return {
    monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY,
    six_month: process.env.RAZORPAY_PLAN_ID_SIX_MONTH ?? process.env.RAZORPAY_PLAN_ID_QUARTERLY,
    yearly: process.env.RAZORPAY_PLAN_ID_YEARLY,
  };
}

/** Map our internal Plan code to Razorpay total_count (number of billing
 *  cycles Razorpay should attempt). One year of coverage per plan, after
 *  which Razorpay marks the subscription `completed` and the user is
 *  prompted to re-subscribe. Per task-5 spec. */
export const TOTAL_COUNT_BY_PLAN: Record<"monthly" | "six_month" | "yearly", number> = {
  monthly: 12,   // 12 monthly cycles = 1 year
  six_month: 2,  // 2 cycles = 1 year
  yearly: 1,     // 1 cycle = 1 year
};

/** Reverse lookup: env-configured plan id -> our internal plan code. */
export function razorpayPlanIdToPlan(
  planId: string | undefined | null,
): "monthly" | "six_month" | "yearly" | null {
  if (!planId) return null;
  const env = planEnv();
  if (planId === env.monthly) return "monthly";
  if (planId === env.six_month) return "six_month";
  if (planId === env.yearly) return "yearly";
  return null;
}
