import { pool } from "../db/pool.js";

export async function getDevices() {
  const result = await pool.query("SELECT * FROM devices ORDER BY created_at DESC");
  return result.rows;
}

export async function addDevice(payload) {
  const result = await pool.query(
    `INSERT INTO devices (student_id, student_name, mac_address, ip_address)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [payload.studentId, payload.studentName, payload.macAddress, payload.ipAddress]
  );
  return result.rows[0];
}

export async function deleteDevice(id) {
  const result = await pool.query("DELETE FROM devices WHERE id = $1 RETURNING *", [id]);
  return result.rows[0] || null;
}

export async function isRegisteredDevice(macAddress) {
  const result = await pool.query("SELECT id FROM devices WHERE mac_address = $1", [macAddress]);
  return result.rows.length > 0;
}
