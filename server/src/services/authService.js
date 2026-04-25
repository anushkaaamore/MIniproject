import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

export async function registerTeacher(payload) {
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const result = await pool.query(
    "INSERT INTO teachers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
    [payload.name, payload.email.toLowerCase(), passwordHash]
  );
  return result.rows[0];
}

export async function loginTeacher(payload) {
  const result = await pool.query("SELECT * FROM teachers WHERE email = $1", [payload.email.toLowerCase()]);
  const teacher = result.rows[0];
  if (!teacher) throw new Error("Invalid credentials");
  const ok = await bcrypt.compare(payload.password, teacher.password_hash);
  if (!ok) throw new Error("Invalid credentials");
  const token = jwt.sign({ teacherId: teacher.id, email: teacher.email }, env.jwtSecret, { expiresIn: "12h" });
  return {
    token,
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email
    }
  };
}
