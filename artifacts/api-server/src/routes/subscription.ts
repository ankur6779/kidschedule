import { Router, type IRouter } from "express";
import {
  getEntitlements,
  startTrial,
  activateSubscription,
  PLAN_PRICES,
  type Plan,
} from "../services/subscriptionService";

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

router.get("/subscription", async (req, res): Promise<void> => {
  const userId = (req as any).auth?.userId as string | undefined;
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

router.post("/subscription/start-trial", async (req, res): Promise<void> => {
  const userId = (req as any).auth?.userId as string | undefined;
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
router.get("/subscription/rc-config", async (req, res): Promise<void> => {
  const userId = (req as any).auth?.userId as string | undefined;
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
router.post("/subscription/checkout", async (req, res): Promise<void> => {
  const userId = (req as any).auth?.userId as string | undefined;
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
  if (expected) {
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

export default router;
