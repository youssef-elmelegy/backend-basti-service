import * as bcrypt from 'bcrypt';
import { MOCK_DATA } from '@/constants/global.constants';
import { env } from '@/env';
import type { TranslationObject } from '@/types/translation.types';

export interface SeedUser {
  id: string;
  firstName: TranslationObject;
  lastName: TranslationObject;
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
  name: TranslationObject;
  image: string;
  isAvailable: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedBakery {
  id: string;
  regionId: string;
  managerId?: string;
  name: TranslationObject;
  locationDescription: TranslationObject;
  capacity: number;
  bakeryTypes: Array<'big_cakes' | 'small_cakes' | 'others'>;
  averageRating?: string;
  totalReviews?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedChef {
  id: string;
  bakeryId: string;
  fullName: TranslationObject;
  image?: string;
  specialization: TranslationObject;
  bio?: TranslationObject;
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
      firstName: {
        en: 'John',
        ar: 'جون',
      },
      lastName: {
        en: 'Doe',
        ar: 'دو',
      },
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
      firstName: {
        en: 'Admin',
        ar: 'مدير',
      },
      lastName: {
        en: 'User',
        ar: 'مستخدم',
      },
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
      firstName: {
        en: 'Sara',
        ar: 'سارة',
      },
      lastName: {
        en: 'Mohamed',
        ar: 'محمد',
      },
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
      firstName: {
        en: 'Mohammed',
        ar: 'محمد',
      },
      lastName: {
        en: 'Karim',
        ar: 'كريم',
      },
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
      firstName: {
        en: 'Fatima',
        ar: 'فاطمة',
      },
      lastName: {
        en: 'Ali',
        ar: 'علي',
      },
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
      name: { en: 'Sirte', ar: 'سيرتي' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038898/basti/general/1771038895856-sirte.png',
      isAvailable: true,
      order: 1,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '5e94f2f4-d65e-45e4-99a9-ed3d4d10c2ff',
      name: { en: 'Tobruk', ar: 'تبروك' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038923/basti/general/1771038922064-tobruk.png',
      isAvailable: true,
      order: 2,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '868046c7-bffc-4927-b504-f5c5eb7c5a24',
      name: { en: 'Tripoli', ar: 'طرابلس' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038949/basti/general/1771038947054-tripoli.png',
      isAvailable: true,
      order: 3,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '92c9f70c-8980-4d21-a517-0f14a8056bb8',
      name: { en: 'Zawiya', ar: 'زوية' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038986/basti/general/1771038984241-zawiya.png',
      isAvailable: true,
      order: 4,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '0c062498-fc5d-4b9a-8759-c7880f6d80aa',
      name: { en: 'zliten', ar: 'زليتن' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771039011/basti/general/1771039007741-zliten.png',
      isAvailable: true,
      order: 5,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '42433844-585a-44f2-ab3a-0e172366c1a7',
      name: { en: 'Misrata', ar: 'مصرات' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038842/basti/general/1771038840893-misrata.png',
      isAvailable: false,
      order: 6,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: 'c4569a6d-fffb-48e9-9952-63d99e4ef9dd',
      name: { en: 'Al Khums', ar: 'الخمس' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038752/basti/general/1771038750497-al_khums.png',
      isAvailable: false,
      order: 7,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '0c062498-fc5d-4b9a-8759-c7880f6d80ff',
      name: { en: 'Ajdabiya', ar: 'عجابية' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038664/basti/general/1771038660147-ajdabiya.png',
      isAvailable: true,
      order: 8,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '71fefdb6-f253-4d10-ac61-27bc01486c1d',
      name: { en: 'Al Bayda', ar: 'البيضاء' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038726/basti/general/1771038724571-al_bayda.png',
      isAvailable: true,
      order: 9,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: '677b65f1-bb4f-4689-bcb8-9a006c763ef1',
      name: { en: 'Benghazi', ar: 'بنغازي' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038771/basti/general/1771038769396-benghazi.png',
      isAvailable: true,
      order: 10,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: 'c684c9c4-2148-4ebd-baaa-44cc3310a51e',
      name: { en: 'Derna', ar: 'درنة' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038809/basti/general/1771038806822-derna.png',
      isAvailable: true,
      order: 11,
      createdAt: new Date('2026-02-13T09:54:17.554Z'),
      updatedAt: new Date('2026-02-13T09:54:17.554Z'),
    },
    {
      id: 'a8582f4e-c290-4dee-94b0-ab408096b66e',
      name: { en: 'Sabha', ar: 'سبحة' },
      image:
        'http://res.cloudinary.com/dzyxpwpcb/image/upload/v1771038871/basti/general/1771038869481-sabha.png',
      isAvailable: true,
      order: 12,
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
      name: { en: 'Downtown Bakery', ar: 'الباكيري المتحدة' },
      locationDescription: { en: '123 Main St, Downtown', ar: '123 شارع الرئيسي، وسط المدينة' },
      capacity: 50,
      bakeryTypes: ['big_cakes', 'small_cakes', 'others'],
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
      fullName: {
        en: 'Ahmed Hassan',
        ar: 'أحمد حسن',
      },
      image:
        'https://imgs.search.brave.com/Etclfj48XsbzlD9Gqv1nH8zw7i59zhiOR0tgvgad-lI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjYv/NTM5LzY4My9zbWFs/bC9jaGVmLWRlY29y/YXRpbmctYS1jYWtl/LXdpdGgtY29sb3Jm/dWwtc3ByaW5rbGVz/LWluLWEtcGFzdGVs/LXBpbmstc3R1ZGlv/LWJhY2tncm91bmQt/cGhvdG8uanBn',
      specialization: { en: 'Pastry Chef', ar: 'مخبر بارز' },
      bio: {
        en: 'Expert in French pastries and desserts with over 10 years of experience',
        ar: 'خبير في المعجنات والحلويات الفرنسية مع أكثر من 10 سنوات من الخبرة',
      },
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440401',
      bakeryId: bakeryId,
      fullName: {
        en: 'Layla Mohamed',
        ar: 'ليلة محمد',
      },
      image:
        'https://imgs.search.brave.com/K5qmesTyowF3J_z_v494_DiTI4h14Oes5tBkX2S5l1A/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjAv/MjIxLzQzNC9zbWFs/bC9hLXNraWxsZWQt/YW5kLXNtaWxpbmct/ZmVtYWxlLWNoZWYt/Y2FyZWZ1bGx5LWRl/Y29yYXRpbmctYS1i/ZWF1dGlmdWxseS1w/cmVzZW50ZWQtY2Fr/ZS1pbi1hLXdlbGwt/ZXF1aXBwZWQtYmFr/ZXJ5LXNldHRpbmct/c2hvd2Nhc2luZy10/aGVpci1jdWxpbmFy/eS1hbmQtYXR0ZW50/aW9uLXRvLWRldGFp/bC1mcmVlLXBob3Rv/LmpwZWc',
      specialization: { en: 'Cake Decorator', ar: 'محاضر حلويات' },
      bio: {
        en: 'Specialized in modern cake decorating and fondant artwork',
        ar: 'محاضر فوندانت الحلويات المتواصلة والحلويات المعدلة',
      },
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440402',
      bakeryId: bakeryId,
      fullName: {
        en: 'Mustafa Ali',
        ar: 'مصطفى علي',
      },
      image:
        'https://imgs.search.brave.com/vupAH6AvDceYg0-tQa1ljydrRp-5psdyoJFaurmXUrM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjYv/NTIxLzI1Mi9zbWFs/bC9hLWNoZWYtaG9s/ZGluZy1hLWNha2Ut/d2l0aC1jaG9jb2xh/dGUtZnJvc3Rpbmct/cGhvdG8uanBlZw',
      specialization: { en: 'Bread Baker', ar: 'مخبر بارز' },
      bio: {
        en: 'Master baker specializing in traditional and artisanal breads',
        ar: 'مخبر بارز المتواصل والمعدل في الخبز التقليدية والخبز المصنعية',
      },
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440403',
      bakeryId: bakeryId,
      fullName: {
        en: 'Fatima Al-Rashid',
        ar: 'فاطمة الراشد',
      },
      image:
        'https://imgs.search.brave.com/5xLVYIONXCuBubREohellPb8iDnRcVzmf2IE8ygFWeI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNDgv/ODIyLzEzMi9zbWFs/bC95b3VuZy1wYXN0/cnktY2hlZi1jYXJl/ZnVsbHktcHJlc2Vu/dGluZy1hLWRlbGln/aHRmdWxseS1kZWNv/cmF0ZWQtbXVsdGkt/bGF5ZXItY2FrZS1p/bi1hLWJ1c3ktYmFr/ZXJ5LWtpdGNoZW4t/ZHVyaW5nLWFmdGVy/bm9vbi1ob3Vycy1w/aG90by5qcGVn',
      specialization: { en: 'Chocolate Specialist', ar: 'مخبر شوكولات' },
      bio: {
        en: 'Master chocolatier with expertise in truffle making and chocolate sculpture',
        ar: 'مخبر شوكولات المتواصل والمعدل في الجزر والسكريبتور',
      },
      createdAt: new Date('2025-01-25'),
      updatedAt: new Date('2025-01-25'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440404',
      bakeryId: bakeryId,
      fullName: {
        en: 'Khalid Ibrahim',
        ar: 'خالد إبراهيم',
      },
      image:
        'https://imgs.search.brave.com/04dtng_3Ga6ktOb3MjGAcUTyqiIbsYd5B2y8CnYdysg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQ3/NTQ2MjY1Ny9waG90/by9jaGVmLWJha2lu/Zy1hbmQtY2FrZS13/aXRoLWNob2NvbGF0/ZS1pbi1hLWtpdGNo/ZW4tYnktYS1oYXBw/eS1tYW4tcHJlcGFy/aW5nLWEtc3dlZXQt/ZGVzZXJ0LW9yLWEu/anBnP3M9NjEyeDYx/MiZ3PTAmaz0yMCZj/PUFuQWlmTjdKRnhW/REpydV9sa3p4NE43/Y2hYZ2YxRXZCZDg0/MlNaMFcxVGM9',
      specialization: { en: 'Sous Chef', ar: 'مخبر فرنسي' },
      bio: {
        en: 'Experienced sous chef managing kitchen operations and quality control',
        ar: 'مخبر فرنسي متخصص في المنظمات والتحكم في الجودة',
      },
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-02-01'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440405',
      bakeryId: bakeryId,
      fullName: {
        en: 'Zainab Hassan',
        ar: 'زينب حسن',
      },
      image:
        'https://imgs.search.brave.com/NQNXQo7J2tcupMR1TUe3fWFJ8WN8RJhd3hxM1YhhzVk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTQ1/NjA4NDk5OC9waG90/by9iZWF1dGlmdWwt/ZmVtYWxlLXBhc3Ry/eS1jaGVmLXByZXBh/cmluZy1jYWtlLWF0/LWhvbWUuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPUZIMjVW/SDRKMENlOVhhRi0y/dmxxNVVfQTlLNl9C/VlhsV1lPZmJLMmdy/UGM9',
      specialization: { en: 'Sugar Artist', ar: 'محاضر سكري' },
      bio: {
        en: 'Specialist in sugar work, fondant, and intricate cake decorations',
        ar: 'محاضر فوندانت السكري والحلويات المعدلة',
      },
      createdAt: new Date('2025-02-05'),
      updatedAt: new Date('2025-02-05'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440406',
      bakeryId: bakeryId,
      fullName: {
        en: 'Omar Karim',
        ar: 'عمر كريم',
      },
      image:
        'https://imgs.search.brave.com/JmVE8kTPzsIwd1AYS-4QUGoXE_6EidG3kgy1n4JoZ0Q/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTgv/MzMwLzc3NC9zbWFs/bC9hLW1hbGUtcGFz/dHJ5LWNoZWYtZGVj/b3JhdGluZy1hLWRl/bGljaW91cy1jYWtl/LXdpdGgtZnJlc2gt/YmVycmllcy1pbi1h/LW1vZGVybi1iYWtl/cnktcGhvdG8uSlBH',
      specialization: { en: 'Head Chef', ar: 'مخبر رئيسي' },
      bio: {
        en: 'Head chef with 20+ years experience managing kitchen teams and menu development',
        ar: 'مخبر رئيسي متخصص في المنظمات والتحكم في الجودة',
      },
      createdAt: new Date('2025-02-10'),
      updatedAt: new Date('2025-02-10'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440407',
      bakeryId: bakeryId,
      fullName: {
        en: 'Noor Al-Mansoori',
        ar: 'نور المنصوري',
      },
      image:
        'https://imgs.search.brave.com/mfDR0-kNNbuIm8k6orD4jhDOB60qfwRAHYQH8C80h5M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjgv/ODQ3LzkyMS9zbWFs/bC9wYXN0cnktY2hl/Zi1wcmVzZW50aW5n/LWEtZGVsaWNpb3Vz/LXN0cmF3YmVycnkt/Y2FrZS1vbi1hLXBp/bmstYmFja2dyb3Vu/ZC1waG90by5qcGc',
      specialization: { en: 'Pastry Assistant', ar: 'مساعد بارز' },
      bio: {
        en: 'Dedicated pastry assistant learning advanced baking techniques',
        ar: 'مساعد بارز متخصص في المنظمات والتحكم في الجودة',
      },
      createdAt: new Date('2025-02-15'),
      updatedAt: new Date('2025-02-15'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440408',
      bakeryId: bakeryId,
      fullName: {
        en: 'Hassan Al-Sharif',
        ar: 'حسن الشريف',
      },
      image:
        'https://imgs.search.brave.com/y7BIyFlw3G6_gUnWAtGmeIe2tAQ0NkZ46p2hnuMRE2c/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNDcv/MzMxLzAyNS9zbWFs/bC9wYXN0cnktY2hl/Zi1zbWlsaW5nLWhv/bGRpbmctc2hvd2lu/Zy1jaG9jb2xhdGUt/Y2FrZS1pbi1raXRj/aGVuLXBob3RvLmpw/Zw',
      specialization: { en: 'Artisan Baker', ar: 'مخبر بارز' },
      bio: {
        en: 'Traditional artisan baker specializing in handcrafted breads and sourdough',
        ar: 'مخبر بارز المتواصل والمعدل في الخبز التقليدية والخبز المصنعية',
      },
      createdAt: new Date('2025-02-20'),
      updatedAt: new Date('2025-02-20'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440409',
      bakeryId: bakeryId,
      fullName: {
        en: 'Salma Elmi',
        ar: 'سلما المي',
      },
      image:
        'https://imgs.search.brave.com/rcYPU_KGl5s6klUNTHBsnPZfF4dOvnMuEHVkJyzVM_M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMzUv/MzYwLzA0NC9zbWFs/bC9haS1nZW5lcmF0/ZWQtY2hlZi1ibGFj/ay1hcHJvbi1jYWtl/LXBvcnRyYWl0LWdl/bmVyYXRlLWFpLXBo/b3RvLmpwZw',
      specialization: { en: 'Wedding Cake Specialist', ar: 'محاضر كعك الزفاف' },
      bio: {
        en: 'Expert in designing and creating stunning wedding cakes and tiered designs',
        ar: 'محاضر كعك الزفاف متخصص في التصميم والتصميم المختلف',
      },
      createdAt: new Date('2025-02-25'),
      updatedAt: new Date('2025-02-25'),
    },
  ];

  return chefs;
}
