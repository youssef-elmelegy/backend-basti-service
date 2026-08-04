/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
/*
  Repairs drizzle's migration bookkeeping.

  Why this exists: `drizzle-kit push` applies DDL straight to the database but
  never records anything in drizzle.__drizzle_migrations. After enough local
  pushes the schema is ahead of the ledger, and `drizzle-kit migrate` starts
  silently skipping files instead of applying them.

  This script records 0003..0006 as applied WITHOUT re-running their SQL —
  their columns were verified to already exist, so re-running would fail with
  "column already exists". It deliberately leaves 0007 unrecorded so that a
  normal `pnpm db:migrate` still applies it.

  Safe to re-run: every insert is guarded by a hash check.

  Usage:  pnpm ts-node -r tsconfig-paths/register --project tsconfig.json \
            src/db/scripts/repair-migration-journal.ts
*/
import { config } from 'dotenv';
import { Client } from 'pg';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

// Applied via `push`, so their DDL must NOT be replayed — only recorded.
const RECORD_ONLY = [
  '0003_petite_mother_askani',
  '0004_pretty_blizzard',
  '0005_brave_zzzax',
  '0006_noisy_black_bolt',
];

// Each entry's `when` from meta/_journal.json, used as created_at so ordering
// matches the journal.
const MIGRATIONS_DIR = join(process.cwd(), 'src/db/migrations');

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta/_journal.json'), 'utf8')) as {
    entries: { idx: number; tag: string; when: number }[];
  };

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query('BEGIN');

    for (const tag of RECORD_ONLY) {
      const entry = journal.entries.find((e) => e.tag === tag);
      if (!entry) {
        throw new Error(`${tag} is missing from _journal.json`);
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, `${tag}.sql`), 'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');

      const { rows } = await client.query(
        'SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1',
        [hash],
      );

      if (rows.length > 0) {
        console.log(`  ${tag}: already recorded, skipping`);
        continue;
      }

      await client.query(
        'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
        [hash, entry.when],
      );
      console.log(`  ${tag}: recorded as applied`);
    }

    await client.query('COMMIT');

    const { rows } = await client.query(
      'SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations',
    );
    console.log(`\nledger now holds ${rows[0].n} rows`);
    console.log('0007 left unrecorded on purpose — run `pnpm db:migrate` to apply it.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('repair failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
