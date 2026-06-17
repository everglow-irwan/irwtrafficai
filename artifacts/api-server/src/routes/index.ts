import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trafficRouter from "./traffic";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trafficRouter);
router.use(aiRouter);

export default router;
