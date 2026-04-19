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
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/reels", reelsRouter);
router.use(worksheetsRouter);
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
router.use(subscriptionRouter);

export default router;
