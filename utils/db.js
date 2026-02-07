import mysql from "mysql2/promise";

/* =======================
   MYSQL CONNECTION POOL
======================= */
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

/* =======================
   TEST CONNECTION
======================= */
export async function testDbConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log("✅ MySQL kapcsolat OK");
  } catch (err) {
    console.error("❌ MySQL kapcsolat HIBA:", err.message);
  }
}
