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
  image: string;
  isAvailable: boolean;
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
      id: '23e2da5b-50a1-4f0e-b051-ce99a8fe620a',
      name: 'Sirte',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038898/basti/general/1771038895856-sirte.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '5e94f2f4-d65e-45e4-99a9-ed3d4d10c2ff',
      name: 'Tobruk',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038923/basti/general/1771038922064-tobruk.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '868046c7-bffc-4927-b504-f5c5eb7c5a24',
      name: 'Tripoli',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038949/basti/general/1771038947054-tripoli.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '92c9f70c-8980-4d21-a517-0f14a8056bb8',
      name: 'Zawiya',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038986/basti/general/1771038984241-zawiya.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '0c062498-fc5d-4b9a-8759-c7880f6d80aa',
      name: 'zliten',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771039011/basti/general/1771039007741-zliten.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '42433844-585a-44f2-ab3a-0e172366c1a7',
      name: 'Misrata',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038842/basti/general/1771038840893-misrata.png',
      isAvailable: false,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: 'c4569a6d-fffb-48e9-9952-63d99e4ef9dd',
      name: 'Al Khums',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038752/basti/general/1771038750497-al_khums.png',
      isAvailable: false,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '0c062498-fc5d-4b9a-8759-c7880f6d80ff',
      name: 'Ajdabiya',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038664/basti/general/1771038660147-ajdabiya.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '71fefdb6-f253-4d10-ac61-27bc01486c1d',
      name: 'Al Bayda',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038726/basti/general/1771038724571-al_bayda.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '677b65f1-bb4f-4689-bcb8-9a006c763ef1',
      name: 'Benghazi',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038771/basti/general/1771038769396-benghazi.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: 'c684c9c4-2148-4ebd-baaa-44cc3310a51e',
      name: 'Derna',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038809/basti/general/1771038806822-derna.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: 'a8582f4e-c290-4dee-94b0-ab408096b66e',
      name: 'Sabha',
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038871/basti/general/1771038869481-sabha.png',
      isAvailable: true,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
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
