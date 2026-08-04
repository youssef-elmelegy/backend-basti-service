import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/env';
import * as schema from './schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Neon drops idle connections; keepAlive helps hold the TCP socket open.
  keepAlive: true,
});

// Neon (serverless Postgres) terminates idle pooled connections. pg surfaces
// that as an 'error' on the idle client — and a Pool with no 'error' listener
// lets it bubble up as an unhandled 'error' event, which crashes the whole
// process. The pool discards the dead client and opens a fresh one on the next
// query, so we just log and keep running.
pool.on('error', (err) => {
  console.error(
    `[db] Idle Postgres client error (connection dropped, will reconnect): ${err.message}`,
  );
});

export const db = drizzle(pool, { schema });
