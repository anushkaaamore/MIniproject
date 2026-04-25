import { env } from "../config/env.js";

export function requireMonitorKey(req, res, next) {
  const key = req.headers["x-monitor-key"];
  if (!key || key !== env.monitorApiKey) {
    return res.status(401).json({ message: "Invalid monitor key" });
  }
  next();
}
