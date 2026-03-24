/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-base-to-string */
import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function pushLocationSchema(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query('BEGIN');

    const tableCheck = await pool.query<{ exists: string | null }>(
      "SELECT to_regclass('public.locations') AS exists",
    );

    if (!tableCheck.rows[0]?.exists) {
      throw new Error('Table "locations" does not exist. Run your base schema setup first.');
    }

    await pool.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "area" varchar(255)`);
    await pool.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "apartment_no" varchar(50)`);
    await pool.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "office_no" varchar(50)`);
    await pool.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "floor" varchar(50)`);
    await pool.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "additional_info" text`);
    await pool.query(`ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "type" varchar(20)`);

    await pool.query(`ALTER TABLE "locations" ALTER COLUMN "area" TYPE varchar(255)`);
    await pool.query(
      `UPDATE "locations" SET "area" = 'Unknown' WHERE "area" IS NULL OR btrim("area") = ''`,
    );
    await pool.query(`ALTER TABLE "locations" ALTER COLUMN "area" SET NOT NULL`);

    await pool.query(`ALTER TABLE "locations" ALTER COLUMN "type" TYPE varchar(20)`);
    await pool.query(`UPDATE "locations" SET "type" = lower("type") WHERE "type" IS NOT NULL`);
    await pool.query(
      `UPDATE "locations" SET "type" = 'house' WHERE "type" IS NULL OR btrim("type") = '' OR "type" NOT IN ('house', 'apartment', 'office')`,
    );
    await pool.query(`ALTER TABLE "locations" ALTER COLUMN "type" SET NOT NULL`);

    await pool.query('COMMIT');
    console.log('✓ Location schema updated successfully');
  } catch (err: unknown) {
    await pool.query('ROLLBACK');
    const message = err instanceof Error ? err.message : String(err);
    console.error('✗ Failed to push location schema:', message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void pushLocationSchema();
