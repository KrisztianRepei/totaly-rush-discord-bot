import mysql from "mysql2/promise";

/*
  Railway / phpMyAdmin kompatibilis MySQL kapcsolat
  Környezeti változók:
  - DB_HOST
  - DB_USER
  - DB_PASSWORD
  - DB_NAME
*/

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
});

/* =======================
   HELPER: egyszerű query
======================= */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/* =======================
   HEALTH CHECK
======================= */
export async function testDbConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL kapcsolat OK");
  } catch (err) {
    console.error("❌ MySQL kapcsolat HIBA:", err.message);
    throw err;
  }
}
