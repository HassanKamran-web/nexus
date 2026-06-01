import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const dbQuery = async (text: string, params?: unknown[]) => {
  const res = await pool.query(text, params);
  return res;
};