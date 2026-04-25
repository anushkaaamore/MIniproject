import { Router } from "express";
import { createAlertHandler } from "../controllers/alertController.js";
import { requireMonitorKey } from "../middlewares/monitorAuthMiddleware.js";

const router = Router();
router.post("/alerts", requireMonitorKey, createAlertHandler);

export default router;
