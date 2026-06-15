import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './src/db/schema';
import {
  getSeedAdmins,
  getSeedBakeries,
  getSeedChefs,
  getSeedRegions,
  getSeedUsers,
} from './src/db/seeds/seed-data';
import { env } from './src/env';

async function seed(): Promise<void> {
  let pool: Pool | null = null;

  try {
    console.log('🌱 Starting database seeding...');

    pool = new Pool({
      connectionString: env.DATABASE_URL,
      keepAlive: true,
    });

    // Without an 'error' listener, a dropped idle connection (Neon closes idle
    // connections) is emitted as an unhandled 'error' event and crashes the
    // seed process. Log it instead; the active query's own try/catch handles
    // any in-flight failure.
    pool.on('error', (err) => {
      console.error(`⚠️  Idle Postgres client error during seeding: ${err.message}`);
    });

    const db = drizzle(pool, { schema });

    // Get seed data
    const regions = getSeedRegions();
    const users = await getSeedUsers();
    const admins = await getSeedAdmins();
    const bakeries = getSeedBakeries(regions, admins);
    const chefs = getSeedChefs(bakeries);

    // Insert regions
    if (regions.length > 0) {
      console.log(`📍 Seeding ${regions.length} region(s)...`);
      await db.insert(schema.regions).values(regions).onConflictDoNothing();
    }

    // Insert users
    if (users.length > 0) {
      console.log(`👥 Seeding ${users.length} user(s)...`);
      await db.insert(schema.users).values(users).onConflictDoNothing();
    }

    // Insert admins
    if (admins.length > 0) {
      console.log(`🔐 Seeding ${admins.length} admin(s)...`);
      await db.insert(schema.admins).values(admins).onConflictDoNothing();
    }

    // Insert bakeries
    if (bakeries.length > 0) {
      console.log(`🥐 Seeding ${bakeries.length} bakery(ies)...`);
      await db.insert(schema.bakeries).values(bakeries).onConflictDoNothing();
    }

    // Insert chefs
    if (chefs.length > 0) {
      console.log(`👨‍🍳 Seeding ${chefs.length} chef(s)...`);
      await db.insert(schema.chefs).values(chefs).onConflictDoNothing();
    }

    console.log('✅ Database seeding completed successfully!');

    if (pool) {
      await pool.end();
    }
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error seeding database:', errorMessage);
    if (pool) {
      await pool.end();
    }
    process.exit(1);
  }
}

void seed();
