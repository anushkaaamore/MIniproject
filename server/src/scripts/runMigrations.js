import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const migrationPaths = [
    path.resolve(__dirname, "../../migrations/001_init.sql"),
    path.resolve(__dirname, "../../migrations/002_teachers.sql")
  ];
  for (const migrationPath of migrationPaths) {
    const sql = await fs.readFile(migrationPath, "utf8");
    await pool.query(sql);
  }
  console.log("Migrations applied");
  await pool.end();
}

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
