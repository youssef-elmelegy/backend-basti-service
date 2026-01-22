import * as bcrypt from 'bcrypt';
import { MOCK_DATA } from '@/constants/global.constants';
import { env } from '@/env';

export interface SeedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  phoneNumber?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedAdmin {
  id: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'manager';
  profileImage?: string;
  bakeryId?: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedRegion {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedBakery {
  id: string;
  regionId: string;
  managerId?: string;
  name: string;
  locationDescription: string;
  capacity: number;
  bakeryTypes: Array<'basket_cakes' | 'medium_cakes' | 'small_cakes' | 'large_cakes' | 'custom'>;
  averageRating?: string;
  totalReviews?: number;
  createdAt: Date;
  updatedAt: Date;
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
      firstName: 'John',
      lastName: 'Doe',
      email: MOCK_DATA.email.user,
      password: await hashPassword('UserPass1'),
      isEmailVerified: true,
      phoneNumber: '+1234567890',
      profileImage: 'https://example.com/john.jpg',
      createdAt: new Date(MOCK_DATA.dates.default),
      updatedAt: new Date(MOCK_DATA.dates.default),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@basti.com',
      password: await hashPassword('AdminPass1'),
      isEmailVerified: true,
      phoneNumber: '+1234567891',
      profileImage: 'https://example.com/admin.jpg',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      firstName: 'Sara',
      lastName: 'Mohamed',
      email: 'sara@example.com',
      password: await hashPassword('SaraPass1'),
      isEmailVerified: true,
      phoneNumber: '+1234567892',
      profileImage: 'https://example.com/sara.jpg',
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      firstName: 'Mohammed',
      lastName: 'Karim',
      email: 'mohammed@example.com',
      password: await hashPassword('MohammedPass1'),
      isEmailVerified: true,
      phoneNumber: '+1234567893',
      profileImage: 'https://example.com/mohammed.jpg',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      firstName: 'Fatima',
      lastName: 'Ali',
      email: 'fatima@example.com',
      password: await hashPassword('FatimaPass1'),
      isEmailVerified: true,
      phoneNumber: '+1234567894',
      profileImage: 'https://example.com/fatima.jpg',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
    },
  ];

  return users;
}

/**
 * Get all seed data for the entire database
 */
export async function getAllSeedData() {
  const regions = getSeedRegions();
  const admins = await getSeedAdmins();
  const bakeries = getSeedBakeries(regions, admins);

  return {
    regions,
    bakeries,
    users: await getSeedUsers(),
    admins,
  };
}

/**
 * Seed regions data
 */
export function getSeedRegions(): SeedRegion[] {
  const regions: SeedRegion[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440100',
      name: 'Downtown Area',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  ];

  return regions;
}

/**
 * Seed bakeries data
 */
export function getSeedBakeries(
  regions: SeedRegion[] = [],
  admins: SeedAdmin[] = [],
): SeedBakery[] {
  const regionId = regions.length > 0 ? regions[0].id : '550e8400-e29b-41d4-a716-446655440100';
  const managerAdmin = admins.find((admin) => admin.role === 'manager');

  const bakeries: SeedBakery[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440200',
      regionId: regionId,
      managerId: managerAdmin?.id,
      name: 'Downtown Bakery',
      locationDescription: 'Located in the heart of downtown with convenient parking',
      capacity: 50,
      bakeryTypes: ['basket_cakes', 'medium_cakes', 'small_cakes', 'custom'],
      averageRating: '4.5',
      totalReviews: 120,
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    },
  ];

  return bakeries;
}

/**
 * Seed admins data
 */
export async function getSeedAdmins(): Promise<SeedAdmin[]> {
  const managerBakeryId = '550e8400-e29b-41d4-a716-446655440200';

  const admins: SeedAdmin[] = [
    {
      id: MOCK_DATA.id.admin,
      email: 'superadmin@basti.com',
      password: await hashPassword('SuperAdminPass1'),
      role: 'super_admin',
      profileImage: 'https://example.com/superadmin.jpg',
      isBlocked: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440300',
      email: 'admin@basti.com',
      password: await hashPassword('AdminPass1'),
      role: 'admin',
      profileImage: 'https://example.com/admin.jpg',
      isBlocked: false,
      createdAt: new Date('2025-01-05'),
      updatedAt: new Date('2025-01-05'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440301',
      email: 'manager@basti.com',
      password: await hashPassword('ManagerPass1'),
      role: 'manager',
      profileImage: 'https://example.com/manager.jpg',
      bakeryId: managerBakeryId,
      isBlocked: false,
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    },
  ];

  return admins;
}
