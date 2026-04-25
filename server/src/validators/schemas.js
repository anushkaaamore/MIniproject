import { z } from "zod";

export const startTestSchema = z.object({
  testId: z.string().min(1),
  testName: z.string().min(1),
  mode: z.enum(["whitelist", "blacklist"]),
  whitelistDomains: z.array(z.string()).default([]),
  blacklistDomains: z.array(z.string()).default([])
});

export const alertSchema = z.object({
  ipAddress: z.string().min(1),
  macAddress: z.string().min(1),
  domainAccessed: z.string().optional(),
  eventType: z.enum([
    "UNAUTHORIZED_DOMAIN",
    "BLACKLISTED_DOMAIN",
    "TRAFFIC_ANOMALY",
    "UNAUTHORIZED_DEVICE"
  ]),
  severity: z.enum(["critical", "high", "medium"]),
  details: z.record(z.unknown()).optional(),
  testSessionId: z.number().int().optional()
});

export const deviceSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  macAddress: z.string().min(1),
  ipAddress: z.string().min(1)
});
