import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, eq, inArray, like, sql } from 'drizzle-orm';
import * as schema from './src/db/schema';
import { hashPassword } from './src/db/seeds/seed-data';
import { env } from './src/env';

/**
 * Direct-to-DB seed for drivers (region-scoped), their orders across every
 * status, and a few reports. Idempotent: re-running replaces the seeded
 * drivers' orders/reports and upserts the drivers by email.
 *
 * Run: pnpm exec ts-node -r tsconfig-paths/register --project tsconfig.json seed-drivers.ts
 */

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

const DRIVERS_PER_REGION = 2;
const SEED_REF_PREFIX = 'SEED-DRV';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);
}

function regionEnName(name: unknown): string {
  if (name && typeof name === 'object' && 'en' in name) {
    const en = (name as { en?: unknown }).en;
    if (typeof en === 'string' && en.trim()) return en.trim();
  }
  return 'region';
}

async function seedDrivers(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log('🌱 Seeding drivers, orders and reports...');

    // Ensure the region_id column exists (added to the schema this iteration but
    // not yet pushed). Guarded + idempotent so this is safe to re-run.
    console.log('🔧 Ensuring admins.region_id column/index/FK exist...');
    await db.execute(sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS region_id uuid`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS admins_region_id_idx ON admins (region_id)`,
    );
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE admins
          ADD CONSTRAINT admins_region_id_regions_id_fk
          FOREIGN KEY (region_id) REFERENCES regions(id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    const regions = await db
      .select({ id: schema.regions.id, name: schema.regions.name })
      .from(schema.regions);
    if (regions.length === 0) throw new Error('No regions found — seed regions first.');

    const users = await db
      .select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
        phoneNumber: schema.users.phoneNumber,
      })
      .from(schema.users)
      .limit(50);
    if (users.length === 0) throw new Error('No users found — seed users first.');

    // Optional: a bakery per region, so active orders look realistic.
    const bakeries = await db
      .select({ id: schema.bakeries.id, regionId: schema.bakeries.regionId })
      .from(schema.bakeries);
    const bakeryByRegion = new Map<string, string>();
    for (const b of bakeries) {
      if (b.regionId && !bakeryByRegion.has(b.regionId)) bakeryByRegion.set(b.regionId, b.id);
    }

    const password = await hashPassword('DriverPass1');
    const now = Date.now();

    const seededDriverIds: string[] = [];
    // (driverId, userId) pairs taken from delivered orders — used for realistic reports.
    const deliveredPairs: { driverId: string; userId: string; driverName: string }[] = [];
    const orderRows: (typeof schema.orders.$inferInsert)[] = [];

    let driverIndex = 0;

    for (const region of regions) {
      const enName = regionEnName(region.name);
      const regionSlug = slugify(enName);

      for (let n = 1; n <= DRIVERS_PER_REGION; n++) {
        const globalIdx = driverIndex++;
        // ~1 in 3 drivers blocked.
        const isBlocked = globalIdx % 3 === 2;
        const email = `driver.${regionSlug}.${n}@basti.com`;
        const driverName = `Driver ${enName} ${n}`;
        const phoneNumber = `+2010${String(100000 + globalIdx).slice(-6)}`;
        const dueAmount = ((globalIdx * 37) % 500).toFixed(2);

        // Upsert the driver by unique email, then read back its id.
        await db
          .insert(schema.admins)
          .values({
            name: driverName,
            email,
            password,
            role: 'driver',
            phoneNumber,
            regionId: region.id,
            dueAmount,
            isBlocked,
            blockedAt: isBlocked ? new Date(now - globalIdx * 3_600_000) : null,
            profileImage: null,
          })
          .onConflictDoNothing({ target: schema.admins.email });

        const [driver] = await db
          .select({ id: schema.admins.id })
          .from(schema.admins)
          .where(eq(schema.admins.email, email))
          .limit(1);
        if (!driver) throw new Error(`Failed to upsert driver ${email}`);

        // Keep regionId in sync for pre-existing rows.
        await db
          .update(schema.admins)
          .set({ regionId: region.id, isBlocked, blockedAt: isBlocked ? new Date(now) : null })
          .where(eq(schema.admins.id, driver.id));

        seededDriverIds.push(driver.id);

        const bakeryId = bakeryByRegion.get(region.id) ?? null;

        // One order per status so each driver has full-status history.
        ORDER_STATUSES.forEach((status, s) => {
          const user = users[(globalIdx + s) % users.length];
          const accepted = status === 'out_for_delivery' || status === 'delivered';
          const assigned = status !== 'pending';
          const createdAt = new Date(now - (globalIdx * 7 + s) * 86_400_000);

          if (status === 'delivered') {
            deliveredPairs.push({ driverId: driver.id, userId: user.id, driverName });
          }

          orderRows.push({
            referenceNumber: `${SEED_REF_PREFIX}-${regionSlug}-${n}-${status}`.slice(0, 50),
            userId: user.id,
            userData: {
              email: user.email,
              firstName: user.firstName ?? 'Test',
              lastName: user.lastName ?? 'User',
              phoneNumber: user.phoneNumber ?? '+201000000000',
            },
            bakeryId,
            driverId: driver.id,
            driverAssignedAt: assigned ? new Date(createdAt.getTime() + 3_600_000) : null,
            driverData: accepted
              ? { name: driverName, profileImage: '', phoneNumber }
              : null,
            locationData: {
              label: 'Home',
              latitude: 32.8872,
              longitude: 13.1913,
              buildingNo: `${10 + s}`,
              street: `${enName} Main St`,
              description: 'Near the square',
            },
            regionId: region.id,
            regionName: enName,
            totalPrice: '100.00',
            discountAmount: '0',
            finalPrice: '110.00',
            deliveryAmount: 10,
            paymentMethodType: 'cash',
            orderStatus: status,
            willDeliverAt: new Date(createdAt.getTime() + 86_400_000),
            deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + 7_200_000) : null,
            keepAnonymous: false,
            cartType: 'others',
            createdAt,
            updatedAt: createdAt,
          });
        });
      }
    }

    // Idempotency: clear previously-seeded orders + this batch's drivers' reports.
    console.log(`🧹 Clearing previous seed orders (${SEED_REF_PREFIX}-*) and reports...`);
    await db.delete(schema.orders).where(like(schema.orders.referenceNumber, `${SEED_REF_PREFIX}-%`));
    if (seededDriverIds.length > 0) {
      await db.delete(schema.reports).where(inArray(schema.reports.driverId, seededDriverIds));
    }

    console.log(`🚚 Upserted ${seededDriverIds.length} drivers across ${regions.length} region(s).`);

    console.log(`📦 Inserting ${orderRows.length} order(s)...`);
    // Chunk to keep parameter counts sane.
    for (let i = 0; i < orderRows.length; i += 50) {
      await db.insert(schema.orders).values(orderRows.slice(i, i + 50)).onConflictDoNothing();
    }

    // Reports: from users who received a delivered order, about ~half the drivers.
    const reportBodies = [
      'Driver arrived late and was not polite.',
      'The cake was slightly damaged on arrival.',
      'Driver could not find the address easily.',
      'Great delivery but a bit late.',
      'Driver was rude on the phone.',
    ];
    const reportRows: (typeof schema.reports.$inferInsert)[] = [];
    deliveredPairs.forEach((pair, i) => {
      if (i % 2 !== 0) return; // report on ~half of them
      reportRows.push({
        userId: pair.userId,
        driverId: pair.driverId,
        reportBody: reportBodies[i % reportBodies.length],
        createdAt: new Date(now - i * 43_200_000),
        updatedAt: new Date(now - i * 43_200_000),
      });
    });

    if (reportRows.length > 0) {
      console.log(`🚩 Inserting ${reportRows.length} report(s)...`);
      await db.insert(schema.reports).values(reportRows);
    }

    // Summary.
    const blockedCount = await db
      .select({ id: schema.admins.id })
      .from(schema.admins)
      .where(and(eq(schema.admins.role, 'driver'), eq(schema.admins.isBlocked, true)));

    console.log('✅ Done.');
    console.log(
      `   drivers=${seededDriverIds.length} (blocked total=${blockedCount.length}), orders=${orderRows.length}, reports=${reportRows.length}`,
    );

    await pool.end();
    process.exit(0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Driver seeding failed:', msg);
    await pool.end();
    process.exit(1);
  }
}

void seedDrivers();
