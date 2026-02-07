import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testDbConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    console.log("✅ MySQL kapcsolat OK");
  } catch (err) {
    console.error("❌ MySQL kapcsolat HIBA:", err.message);
    process.exit(1); // bot leáll, ha nincs DB
  }
}
