import { NextResponse } from "next/server";
import pg from "pg";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "NOT SET";
  const masked = url.replace(/:([^:@]+)@/, ":***@");

  try {
    const pool = new pg.Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });
    const result = await pool.query("SELECT 1 as ok");
    await pool.end();
    return NextResponse.json({ status: "connected", url: masked, result: result.rows });
  } catch (err) {
    return NextResponse.json({
      status: "failed",
      url: masked,
      error: String(err),
    });
  }
}
