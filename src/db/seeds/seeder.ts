import { Logger } from '@nestjs/common';
import { db } from '../index';
import { users, admins, regions, bakeries, chefs } from '../schema';
import { getAllSeedData } from './seed-data';

const logger = new Logger('DatabaseSeeder');

export async function seed(): Promise<void> {
  try {
    logger.log('Starting database seeding...');

    const seedData = await getAllSeedData();

    logger.log('Clearing existing users...');
    await db.delete(users);

    logger.log('Clearing existing admins...');
    await db.delete(admins);

    logger.log('Clearing existing bakeries...');
    await db.delete(bakeries);

    logger.log('Clearing existing chefs...');
    await db.delete(chefs);

    logger.log('Clearing existing regions...');
    await db.delete(regions);

    logger.log(`Inserting ${seedData.regions?.length || 0} regions...`);
    if (seedData.regions && seedData.regions.length > 0) {
      await db.insert(regions).values(seedData.regions);
    }

    logger.log(`Inserting ${seedData.admins.length} admins...`);
    await db.insert(admins).values(seedData.admins);

    logger.log(`Inserting ${seedData.bakeries.length} bakeries...`);
    await db.insert(bakeries).values(seedData.bakeries);

    logger.log(`Inserting ${seedData.chefs.length} chefs...`);
    await db.insert(chefs).values(seedData.chefs);

    logger.log(`Inserting ${seedData.users.length} users...`);
    await db.insert(users).values(seedData.users);

    logger.log('✅ Database seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Database seeding failed!', error);
    throw error;
  }
}

/**
 * Run seeding on application startup
 * Call this in main.ts bootstrap if needed
 */
export async function seedOnBootstrap(): Promise<void> {
  try {
    const userCount = await db.select().from(users).limit(1);

    if (userCount.length === 0) {
      logger.warn('No users found. Running seed...');
      await seed();
    } else {
      logger.log('Database already seeded. Skipping...');
    }
  } catch {
    logger.warn('Could not check database state. Proceeding...');
  }
}
