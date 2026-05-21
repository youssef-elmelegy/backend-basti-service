import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config();

const {
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT = '5432',
  DB_DATABASE,
  DB_SSL = 'false',
  DATABASE_URL,
} = process.env;

function buildUrl(): string {
  if (DATABASE_URL) return DATABASE_URL;

  if (!DB_USERNAME || !DB_PASSWORD || !DB_HOST || !DB_DATABASE) {
    throw new Error(
      'drizzle-kit: set DATABASE_URL, or all of DB_USERNAME, DB_PASSWORD, DB_HOST, DB_DATABASE',
    );
  }

  const user = encodeURIComponent(DB_USERNAME);
  const pass = encodeURIComponent(DB_PASSWORD);
  const db = encodeURIComponent(DB_DATABASE);
  const sslQuery = DB_SSL === 'true' ? '?sslmode=require&channel_binding=require' : '';
  return `postgresql://${user}:${pass}@${DB_HOST}:${DB_PORT}/${db}${sslQuery}`;
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: buildUrl() },
});
