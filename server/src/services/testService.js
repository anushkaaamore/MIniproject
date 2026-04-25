import { pool } from "../db/pool.js";

export async function getActiveTest() {
  const result = await pool.query(
    "SELECT * FROM test_sessions WHERE status = 'active' ORDER BY start_time DESC LIMIT 1"
  );
  return result.rows[0] || null;
}

export async function startTestSession(payload) {
  await pool.query("UPDATE test_sessions SET status = 'ended', end_time = NOW() WHERE status = 'active'");
  const result = await pool.query(
    `INSERT INTO test_sessions (test_id, test_name, mode, whitelist_domains, blacklist_domains, status)
     VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
    [payload.testId, payload.testName, payload.mode, payload.whitelistDomains, payload.blacklistDomains]
  );
  return result.rows[0];
}

export async function endTestSession(id) {
  const result = await pool.query(
    "UPDATE test_sessions SET status = 'ended', end_time = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

export async function getTestHistory() {
  const result = await pool.query(
    `SELECT ts.*,
      COUNT(a.id)::int AS total_alerts,
      COUNT(DISTINCT a.mac_address)::int AS devices_monitored
     FROM test_sessions ts
     LEFT JOIN alerts a ON a.test_session_id = ts.id
     GROUP BY ts.id
     ORDER BY ts.start_time DESC`
  );
  return result.rows;
}
