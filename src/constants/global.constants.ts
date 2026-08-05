export const MOCK_DATA = {
  id: {
    user: '550e8400-e29b-41d4-a716-446655440000',
    region: '660e8400-e29b-41d4-a716-446655440001',
    bakery: '770e8400-e29b-41d4-a716-446655440002',
    chef: '880e8400-e29b-41d4-a716-446655440003',
    cake: '990e8400-e29b-41d4-a716-446655440005',
    add: 'aa0e8400-e29b-41d4-a716-446655440006',
    admin: '990e8400-e29b-41d4-a716-446655440004',
    sliderImage: 'bb0e8400-e29b-41d4-a716-446655440007',
    cartItem: 'cc0e8400-e29b-41d4-a716-446655440008',
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
    region: 'https://www.qmul.ac.uk/geog/media/qmul/ihss/City-Centre-banner.jpg',
    sliderImages: [
      'https://api.example.com/images/sliders/summer-collection.jpg',
      'https://api.example.com/images/sliders/winter-special.jpg',
    ],
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
  LARGE_CAKES: 'large_cakes',
  SMALL_CAKES: 'small_cakes',
  OTHER: 'other',
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

/**
 * How long a bakery has, from `orders.assigningDate`, to accept or decline an
 * order assigned to it. Past this window the bakery can no longer unassign
 * itself and the order auto-confirms (see OrderAutoConfirmService).
 */
export const BAKERY_ASSIGNMENT_RESPONSE_WINDOW_MS = 60 * 60 * 1000;

/**
 * How long a driver has, from `orders.driverAssignedAt`, to accept an order
 * assigned to them. Past this window the assignment expires and the order is
 * returned to the unassigned pool for an admin to reassign
 * (see OrderAutoConfirmService). Acceptance is recorded as `driverData`.
 */
export const DRIVER_ASSIGNMENT_RESPONSE_WINDOW_MS = 60 * 60 * 1000;

export const BAKERY_DEFAULTS = {
  BAKERY_OPEN_HOUR: 10,
  BAKERY_CLOSE_HOUR: 18,
  MIN_HOURS_TO_PREPARE: 24,
} as const;

/**
 * Account deletion anonymizes rather than cascades: orders, reviews and coupon
 * usages are repointed at this sentinel user so historical records survive,
 * then the real user row is deleted. Seeded by migration
 * 0007_deleted_user_sentinel.
 */
export const DELETED_USER = {
  ID: '00000000-0000-0000-0000-000000000000',
  FIRST_NAME: 'Deleted',
  LAST_NAME: 'User',
  EMAIL: 'deleted-user@deleted.invalid',
  PHONE_NUMBER: '',
  LOCATION_LABEL: 'Deleted address',
} as const;
