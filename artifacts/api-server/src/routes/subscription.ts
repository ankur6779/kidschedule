import { Router, type IRouter } from "express";
import {
  getEntitlements,
  startTrial,
  PLAN_PRICES,
  type Plan,
} from "../services/subscriptionService";

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
 * Checkout endpoint — returns 501 until a payment provider (Stripe/RevenueCat)
 * is configured. The mobile/web client uses this to know whether the
 * "Upgrade Now" button should hand off to a provider checkout flow or
 * surface a "Coming soon" message.
 */
router.post("/subscription/checkout", async (req, res): Promise<void> => {
  const userId = (req as any).auth?.userId as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.status(501).json({
    error: "payment_provider_unconfigured",
    message:
      "Configure Stripe or RevenueCat keys to enable checkout. Until then, server-side activation is admin-only.",
  });
});

export default router;
