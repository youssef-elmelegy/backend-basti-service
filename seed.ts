import { seed } from './src/db/seeds';

/**
 * Standalone seeder script
 * Run with: npm run seed
 */
async function main() {
  try {
    console.log('🌱 Starting database seeder...\n');
    await seed();
    console.log('\n✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

void main();
