import { Router, type IRouter } from "express";
import healthRouter from "./health";
import childrenRouter from "./children";
import routinesRouter from "./routines";
import behaviorsRouter from "./behaviors";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(childrenRouter);
router.use(routinesRouter);
router.use(behaviorsRouter);
router.use(dashboardRouter);

export default router;
