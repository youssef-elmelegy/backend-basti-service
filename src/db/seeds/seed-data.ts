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

export interface SeedChef {
  id: string;
  bakeryId: string;
  fullName: string;
  image?: string;
  specialization: string;
  bio?: string;
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
  const chefs = getSeedChefs(bakeries);

  return {
    regions,
    bakeries,
    chefs,
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

/**
 * Seed chefs data
 */
export function getSeedChefs(bakeries: SeedBakery[] = []): SeedChef[] {
  const bakeryId = bakeries.length > 0 ? bakeries[0].id : '550e8400-e29b-41d4-a716-446655440200';

  const chefs: SeedChef[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440400',
      bakeryId: bakeryId,
      fullName: 'Ahmed Hassan',
      image:
        'https://imgs.search.brave.com/Etclfj48XsbzlD9Gqv1nH8zw7i59zhiOR0tgvgad-lI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjYv/NTM5LzY4My9zbWFs/bC9jaGVmLWRlY29y/YXRpbmctYS1jYWtl/LXdpdGgtY29sb3Jm/dWwtc3ByaW5rbGVz/LWluLWEtcGFzdGVs/LXBpbmstc3R1ZGlv/LWJhY2tncm91bmQt/cGhvdG8uanBn',
      specialization: 'Pastry Chef',
      bio: 'Expert in French pastries and custom cake designs with 15 years of experience',
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440401',
      bakeryId: bakeryId,
      fullName: 'Layla Mohamed',
      image:
        'https://imgs.search.brave.com/K5qmesTyowF3J_z_v494_DiTI4h14Oes5tBkX2S5l1A/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjAv/MjIxLzQzNC9zbWFs/bC9hLXNraWxsZWQt/YW5kLXNtaWxpbmct/ZmVtYWxlLWNoZWYt/Y2FyZWZ1bGx5LWRl/Y29yYXRpbmctYS1i/ZWF1dGlmdWxseS1w/cmVzZW50ZWQtY2Fr/ZS1pbi1hLXdlbGwt/ZXF1aXBwZWQtYmFr/ZXJ5LXNldHRpbmct/c2hvd2Nhc2luZy10/aGVpci1jdWxpbmFy/eS1hbmQtYXR0ZW50/aW9uLXRvLWRldGFp/bC1mcmVlLXBob3Rv/LmpwZWc',
      specialization: 'Cake Decorator',
      bio: 'Specialized in modern cake decorating and fondant artwork',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440402',
      bakeryId: bakeryId,
      fullName: 'Mustafa Ali',
      image:
        'https://imgs.search.brave.com/vupAH6AvDceYg0-tQa1ljydrRp-5psdyoJFaurmXUrM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjYv/NTIxLzI1Mi9zbWFs/bC9hLWNoZWYtaG9s/ZGluZy1hLWNha2Ut/d2l0aC1jaG9jb2xh/dGUtZnJvc3Rpbmct/cGhvdG8uanBlZw',
      specialization: 'Bread Baker',
      bio: 'Master baker specializing in traditional and artisanal breads',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440403',
      bakeryId: bakeryId,
      fullName: 'Fatima Al-Rashid',
      image:
        'https://imgs.search.brave.com/5xLVYIONXCuBubREohellPb8iDnRcVzmf2IE8ygFWeI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNDgv/ODIyLzEzMi9zbWFs/bC95b3VuZy1wYXN0/cnktY2hlZi1jYXJl/ZnVsbHktcHJlc2Vu/dGluZy1hLWRlbGln/aHRmdWxseS1kZWNv/cmF0ZWQtbXVsdGkt/bGF5ZXItY2FrZS1p/bi1hLWJ1c3ktYmFr/ZXJ5LWtpdGNoZW4t/ZHVyaW5nLWFmdGVy/bm9vbi1ob3Vycy1w/aG90by5qcGVn',
      specialization: 'Chocolate Specialist',
      bio: 'Master chocolatier with expertise in truffle making and chocolate sculpture',
      createdAt: new Date('2025-01-25'),
      updatedAt: new Date('2025-01-25'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440404',
      bakeryId: bakeryId,
      fullName: 'Khalid Ibrahim',
      image:
        'https://imgs.search.brave.com/04dtng_3Ga6ktOb3MjGAcUTyqiIbsYd5B2y8CnYdysg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQ3/NTQ2MjY1Ny9waG90/by9jaGVmLWJha2lu/Zy1hbmQtY2FrZS13/aXRoLWNob2NvbGF0/ZS1pbi1hLWtpdGNo/ZW4tYnktYS1oYXBw/eS1tYW4tcHJlcGFy/aW5nLWEtc3dlZXQt/ZGVzZXJ0LW9yLWEu/anBnP3M9NjEyeDYx/MiZ3PTAmaz0yMCZj/PUFuQWlmTjdKRnhW/REpydV9sa3p4NE43/Y2hYZ2YxRXZCZDg0/MlNaMFcxVGM9',
      specialization: 'Sous Chef',
      bio: 'Experienced sous chef managing kitchen operations and quality control',
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-02-01'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440405',
      bakeryId: bakeryId,
      fullName: 'Zainab Hassan',
      image:
        'https://imgs.search.brave.com/NQNXQo7J2tcupMR1TUe3fWFJ8WN8RJhd3hxM1YhhzVk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTQ1/NjA4NDk5OC9waG90/by9iZWF1dGlmdWwt/ZmVtYWxlLXBhc3Ry/eS1jaGVmLXByZXBh/cmluZy1jYWtlLWF0/LWhvbWUuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPUZIMjVW/SDRKMENlOVhhRi0y/dmxxNVVfQTlLNl9C/VlhsV1lPZmJLMmdy/UGM9',
      specialization: 'Sugar Artist',
      bio: 'Specialist in sugar work, fondant, and intricate cake decorations',
      createdAt: new Date('2025-02-05'),
      updatedAt: new Date('2025-02-05'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440406',
      bakeryId: bakeryId,
      fullName: 'Omar Karim',
      image:
        'https://imgs.search.brave.com/JmVE8kTPzsIwd1AYS-4QUGoXE_6EidG3kgy1n4JoZ0Q/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTgv/MzMwLzc3NC9zbWFs/bC9hLW1hbGUtcGFz/dHJ5LWNoZWYtZGVj/b3JhdGluZy1hLWRl/bGljaW91cy1jYWtl/LXdpdGgtZnJlc2gt/YmVycmllcy1pbi1h/LW1vZGVybi1iYWtl/cnktcGhvdG8uSlBH',
      specialization: 'Head Chef',
      bio: 'Head chef with 20+ years experience managing kitchen teams and menu development',
      createdAt: new Date('2025-02-10'),
      updatedAt: new Date('2025-02-10'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440407',
      bakeryId: bakeryId,
      fullName: 'Noor Al-Mansoori',
      image:
        'https://imgs.search.brave.com/mfDR0-kNNbuIm8k6orD4jhDOB60qfwRAHYQH8C80h5M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjgv/ODQ3LzkyMS9zbWFs/bC9wYXN0cnktY2hl/Zi1wcmVzZW50aW5n/LWEtZGVsaWNpb3Vz/LXN0cmF3YmVycnkt/Y2FrZS1vbi1hLXBp/bmstYmFja2dyb3Vu/ZC1waG90by5qcGc',
      specialization: 'Pastry Assistant',
      bio: 'Dedicated pastry assistant learning advanced baking techniques',
      createdAt: new Date('2025-02-15'),
      updatedAt: new Date('2025-02-15'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440408',
      bakeryId: bakeryId,
      fullName: 'Hassan Al-Sharif',
      image:
        'https://imgs.search.brave.com/y7BIyFlw3G6_gUnWAtGmeIe2tAQ0NkZ46p2hnuMRE2c/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNDcv/MzMxLzAyNS9zbWFs/bC9wYXN0cnktY2hl/Zi1zbWlsaW5nLWhv/bGRpbmctc2hvd2lu/Zy1jaG9jb2xhdGUt/Y2FrZS1pbi1raXRj/aGVuLXBob3RvLmpw/Zw',
      specialization: 'Artisan Baker',
      bio: 'Traditional artisan baker specializing in handcrafted breads and sourdough',
      createdAt: new Date('2025-02-20'),
      updatedAt: new Date('2025-02-20'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440409',
      bakeryId: bakeryId,
      fullName: 'Salma Elmi',
      image:
        'https://imgs.search.brave.com/rcYPU_KGl5s6klUNTHBsnPZfF4dOvnMuEHVkJyzVM_M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMzUv/MzYwLzA0NC9zbWFs/bC9haS1nZW5lcmF0/ZWQtY2hlZi1ibGFj/ay1hcHJvbi1jYWtl/LXBvcnRyYWl0LWdl/bmVyYXRlLWFpLXBo/b3RvLmpwZw',
      specialization: 'Wedding Cake Specialist',
      bio: 'Expert in designing and creating stunning wedding cakes and tiered designs',
      createdAt: new Date('2025-02-25'),
      updatedAt: new Date('2025-02-25'),
    },
  ];

  return chefs;
}
