import * as bcrypt from 'bcrypt';
import { MOCK_DATA } from '@/constants/global.constants';
import { env } from '@/env';

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Generate hashed password for seeding
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Seed users data
 */
export async function getSeedUsers(): Promise<SeedUser[]> {
  const users: SeedUser[] = [
    {
      id: MOCK_DATA.id.user,
      name: MOCK_DATA.name.user,
      email: MOCK_DATA.email.user,
      password: await hashPassword('userPass1'),
      created_at: new Date(MOCK_DATA.dates.default),
      updated_at: new Date(MOCK_DATA.dates.default),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440001',
      name: 'Admin User',
      email: 'admin@basti.com',
      password: await hashPassword('userPass2'),
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01'),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440002',
      name: 'Sara Mohamed',
      email: 'sara@example.com',
      password: await hashPassword('userPass3'),
      created_at: new Date('2025-01-10'),
      updated_at: new Date('2025-01-10'),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440003',
      name: 'Mohammed Karim',
      email: 'mohammed@example.com',
      password: await hashPassword('userPass4'),
      created_at: new Date('2025-01-15'),
      updated_at: new Date('2025-01-15'),
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440004',
      name: 'Fatima Ali',
      email: 'fatima@example.com',
      password: await hashPassword('userPass5'),
      created_at: new Date('2025-01-20'),
      updated_at: new Date('2025-01-20'),
    },
  ];

  return users;
}

/**
 * Get all seed data for the entire database
 */
export async function getAllSeedData() {
  return {
    users: await getSeedUsers(),
  };
}
