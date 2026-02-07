import mysql from "mysql2/promise";

/* =======================
   MYSQL POOL (Railway)
======================= */
export const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT || 3306),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z"
});

/* =======================
   TEST CONNECTION
======================= */
export async function testDbConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();

    console.log("✅ MySQL kapcsolat OK (Railway)");
  } catch (err) {
    console.error("❌ MySQL kapcsolat HIBA");
    console.error(err.message);
  }
}
