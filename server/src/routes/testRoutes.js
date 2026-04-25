import { Router } from "express";
import { activeTest, endTest, startTest, testHistory } from "../controllers/testController.js";

const router = Router();

router.post("/start", startTest);
router.put("/:id/end", endTest);
router.get("/active", activeTest);
router.get("/history", testHistory);

export default router;
