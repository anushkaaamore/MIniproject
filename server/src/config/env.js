import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "change-me",
  monitorApiKey: process.env.MONITOR_API_KEY || "monitor-key"
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
