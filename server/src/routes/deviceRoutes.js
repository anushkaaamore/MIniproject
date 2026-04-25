import { Router } from "express";
import { createDevice, listDevices, removeDevice } from "../controllers/deviceController.js";

const router = Router();

router.get("/", listDevices);
router.post("/", createDevice);
router.delete("/:id", removeDevice);

export default router;
