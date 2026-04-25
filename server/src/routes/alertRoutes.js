import { Router } from "express";
import {
  activeAlerts,
  createAlertHandler,
  exportAlerts,
  liveStats,
  testAlerts
} from "../controllers/alertController.js";

const router = Router();

router.post("/", createAlertHandler);
router.get("/active", activeAlerts);
router.get("/stats/live", liveStats);
router.get("/test/:testId", testAlerts);
router.get("/export/:testId", exportAlerts);

export default router;
