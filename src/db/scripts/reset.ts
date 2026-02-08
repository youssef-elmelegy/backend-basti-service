/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-base-to-string */
import { config } from 'dotenv';
import { Pool } from 'pg';

config();

interface TableRow {
  tablename: string;
}

async function resetDatabase(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get all tables
    const result = await pool.query<TableRow>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );

    const tables: string[] = result.rows.map((row: TableRow) => row.tablename);

    if (tables.length === 0) {
      console.log('✓ No tables to drop');
      await pool.end();
      return;
    }

    // Drop all tables with CASCADE
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`✓ Dropped table: ${table}`);
    }

    console.log('\n✓ Database reset successfully!');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('✗ Error resetting database:', message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void resetDatabase();
