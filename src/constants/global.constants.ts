export const MOCK_DATA = {
  id: {
    user: '550e8400-e29b-41d4-a716-446655440000',
  },
  email: {
    user: 'ahmed@example.com',
  },
  phone: {
    user: '+201001234567',
  },
  name: {
    user: 'Ahmed Hassan',
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
