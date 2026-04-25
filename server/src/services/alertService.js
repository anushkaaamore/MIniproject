import { pool } from "../db/pool.js";
import { getActiveTest } from "./testService.js";

function normalizeDomain(domain = "") {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/\.$/, "")
    .replace(/^www\./, "");
}

function domainMatchesRule(domain, rule) {
  if (!domain || !rule) return false;
  return domain === rule || domain.endsWith(`.${rule}`);
}

export async function evaluatePolicy(activeTest, domainAccessed) {
  if (!activeTest || !domainAccessed) return null;
  const domain = normalizeDomain(domainAccessed);
  if (activeTest.mode === "whitelist") {
    const allowed = (activeTest.whitelist_domains || []).map(normalizeDomain);
    const isAllowed = allowed.some((rule) => domainMatchesRule(domain, rule));
    if (!isAllowed) {
      return { eventType: "UNAUTHORIZED_DOMAIN", severity: "high" };
    }
  }
  if (activeTest.mode === "blacklist") {
    const blocked = (activeTest.blacklist_domains || []).map(normalizeDomain);
    const isBlocked = blocked.some((rule) => domainMatchesRule(domain, rule));
    if (isBlocked) {
      return { eventType: "BLACKLISTED_DOMAIN", severity: "critical" };
    }
  }
  return null;
}

export async function createAlert(payload) {
  const activeTest = payload.testSessionId
    ? { id: payload.testSessionId }
    : await getActiveTest();

  if (!activeTest) {
    throw new Error("No active test session");
  }

  const result = await pool.query(
    `INSERT INTO alerts (test_session_id, ip_address, mac_address, domain_accessed, event_type, severity, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      activeTest.id,
      payload.ipAddress,
      payload.macAddress,
      payload.domainAccessed || null,
      payload.eventType,
      payload.severity,
      payload.details || {}
    ]
  );
  return result.rows[0];
}

export async function getAlertsByTest(testSessionId) {
  const result = await pool.query(
    "SELECT * FROM alerts WHERE test_session_id = $1 ORDER BY created_at DESC",
    [testSessionId]
  );
  return result.rows;
}

export async function getActiveAlerts() {
  const active = await getActiveTest();
  if (!active) return [];
  return getAlertsByTest(active.id);
}

export async function getLiveStats() {
  const active = await getActiveTest();
  if (!active) {
    return {
      activeTest: null,
      totalDevicesConnected: 0,
      activeAlertsCount: 0,
      severityBreakdown: { critical: 0, high: 0, medium: 0 }
    };
  }

  const [alertsCountResult, severityResult, devicesResult] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM alerts WHERE test_session_id = $1", [active.id]),
    pool.query(
      `SELECT severity, COUNT(*)::int AS count
       FROM alerts WHERE test_session_id = $1 GROUP BY severity`,
      [active.id]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT mac_address)::int AS count
       FROM alerts
       WHERE test_session_id = $1 AND created_at >= NOW() - INTERVAL '2 minutes'`,
      [active.id]
    )
  ]);

  const severityBreakdown = { critical: 0, high: 0, medium: 0 };
  severityResult.rows.forEach((row) => {
    severityBreakdown[row.severity] = row.count;
  });

  return {
    activeTest: active,
    totalDevicesConnected: devicesResult.rows[0]?.count || 0,
    activeAlertsCount: alertsCountResult.rows[0]?.count || 0,
    severityBreakdown
  };
}
