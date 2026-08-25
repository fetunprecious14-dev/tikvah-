import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import conversationsRouter from "./conversations";
import notificationsRouter from "./notifications";
import resourcesRouter from "./resources";
import professionalsRouter from "./professionals";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(conversationsRouter);
router.use(notificationsRouter);
router.use(resourcesRouter);
router.use(professionalsRouter);
router.use(adminRouter);

export default router;
