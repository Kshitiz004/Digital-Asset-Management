import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Role } from '../entities/role.entity';
import { seedDatabase } from './seed';

/**
 * Run seed script
 * Usage: npx ts-node src/database/seed-runner.ts
 */
config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'dam_db',
    entities: [Role],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    await seedDatabase(dataSource);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await dataSource.destroy();
  }
}

void runSeed();
