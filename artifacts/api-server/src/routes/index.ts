import { Router, type IRouter } from "express";
import healthRouter from "./health";
import childrenRouter from "./children";
import routinesRouter from "./routines";
import behaviorsRouter from "./behaviors";
import dashboardRouter from "./dashboard";
import parentProfileRouter from "./parent-profile";
import babysittersRouter from "./babysitters";
import aiRouter from "./ai";
import aiCoachRouter from "./ai-coach";
import appDataRouter from "./app-data";
import subscriptionRouter from "./subscription";
import reelsRouter from "./reels";
import worksheetsRouter from "./worksheets";
import onboardingRouter from "./onboarding";
import futurePredictorRouter from "./future-predictor";
import referralsRouter from "./referrals";
import featuresRouter from "./features";
import mealsRouter from "./meals";
import accountRouter from "./account";
import pushRouter from "./push";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/reels", reelsRouter);
router.use(worksheetsRouter);
// Subscription router contains the public RevenueCat webhook endpoint
// (authenticated by REVENUECAT_WEBHOOK_SECRET), so it must be mounted
// BEFORE the global requireAuth gate. Authenticated subscription
// endpoints inside the router enforce auth on a per-route basis.
router.use(subscriptionRouter);
router.use(requireAuth);
router.use(onboardingRouter);
router.use(childrenRouter);
router.use(routinesRouter);
router.use(behaviorsRouter);
router.use(dashboardRouter);
router.use(parentProfileRouter);
router.use(babysittersRouter);
router.use(aiRouter);
router.use(aiCoachRouter);
router.use(appDataRouter);
router.use(futurePredictorRouter);
router.use(referralsRouter);
router.use(featuresRouter);
router.use(mealsRouter);
router.use(accountRouter);
router.use(pushRouter);

export default router;
