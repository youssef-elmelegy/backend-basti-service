export const MOCK_DATA = {
  id: {
    user: '550e8400-e29b-41d4-a716-446655440000',
    region: '660e8400-e29b-41d4-a716-446655440001',
    bakery: '770e8400-e29b-41d4-a716-446655440002',
    chef: '880e8400-e29b-41d4-a716-446655440003',
    cake: '990e8400-e29b-41d4-a716-446655440005',
    add: 'aa0e8400-e29b-41d4-a716-446655440006',
    admin: '990e8400-e29b-41d4-a716-446655440004',
  },
  email: {
    user: 'ahmed@example.com',
  },
  phone: {
    user: '+201001234567',
  },
  name: {
    user: 'Ahmed Hassan',
    region: 'Cairo',
    bakery: 'Sweet Cairo Bakery',
    chef: 'John Anderson',
  },
  location: {
    bakery: '12 El-Maadi St, Cairo',
  },
  image: {
    chef: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  numbers: {
    capacity: 50,
    employees: 15,
    rating: 4.8,
  },
  dates: {
    default: '2025-11-27T10:00:00.000Z',
  },
} as const;

export const MOCK_IMAGES = {
  avatars: {
    male: 'https://api.example.com/images/avatars/male-default.jpg',
    female: 'https://api.example.com/images/avatars/female-default.jpg',
    default: 'https://api.example.com/images/avatars/default.jpg',
  },
} as const;

export const BAKERY_TYPES = {
  BASKET_CAKES: 'basket_cakes',
  MIDUME: 'midume',
  SMALL_CAKES: 'small_cakes',
  LARGE_CAKES: 'large_cakes',
  CUSTOM: 'custom',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const SORT_DEFAULTS = {
  SORT: 'created_at',
  ORDER: 'desc',
} as const;

export const BAKERY_DEFAULTS = {
  BAKERY_OPEN_HOUR: 10,
  BAKERY_CLOSE_HOUR: 18,
  MIN_HOURS_TO_PREPARE: 24,
} as const;
