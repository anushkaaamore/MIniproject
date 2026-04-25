import cors from "cors";
import express from "express";
import testRoutes from "./routes/testRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import monitorRoutes from "./routes/monitorRoutes.js";
import { requireAuth } from "./middlewares/authMiddleware.js";
import { env } from "./config/env.js";

export const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/monitor", monitorRoutes);
app.use("/api/tests", requireAuth, testRoutes);
app.use("/api/alerts", requireAuth, alertRoutes);
app.use("/api/devices", requireAuth, deviceRoutes);

app.use((error, req, res, next) => {
  const message = error?.message || "Unexpected server error";
  res.status(400).json({ message });
});
