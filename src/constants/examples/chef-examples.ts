import { MOCK_DATA } from '../global.constants';

export const ChefExamples = {
  create: {
    request: {
      name: 'John Anderson',
      specialization: 'Pastry Chef',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      bio: 'Experienced pastry chef with 10 years of culinary expertise. Specializes in French pastries and cake decorations.',
      bakeryId: '770e8400-e29b-41d4-a716-446655440002',
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Chef created successfully',
        data: {
          id: 'bb0e8400-e29b-41d4-a716-446655440001',
          fullName: 'John Anderson',
          specialization: 'Pastry Chef',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
          bio: 'Experienced pastry chef with 10 years of culinary expertise. Specializes in French pastries and cake decorations.',
          bakery: {
            id: '770e8400-e29b-41d4-a716-446655440002',
            name: 'Sweet Dreams Bakery',
          },
          createdAt: '2026-02-08T10:00:00Z',
          updatedAt: '2026-02-08T10:00:00Z',
        },
        timestamp: '2026-02-08T10:00:00Z',
      },
    },
  },
  update: {
    request: {
      name: 'Jane Smith',
      specialization: 'Cake Designer',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      bio: 'Creative cake designer with expertise in 3D cake art and fondant work. Specializes in custom wedding cakes.',
      bakeryId: '770e8400-e29b-41d4-a716-446655440002',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Chef updated successfully',
        data: {
          id: 'bb0e8400-e29b-41d4-a716-446655440001',
          fullName: 'Jane Smith',
          specialization: 'Cake Designer',
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
          bio: 'Creative cake designer with expertise in 3D cake art and fondant work. Specializes in custom wedding cakes.',
          bakery: {
            id: '770e8400-e29b-41d4-a716-446655440002',
            name: 'Sweet Dreams Bakery',
          },
          createdAt: '2026-02-08T10:00:00Z',
          updatedAt: '2026-02-08T10:00:00Z',
        },
        timestamp: '2026-02-08T10:00:00Z',
      },
    },
  },
  getAllPaginated: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Chefs retrieved successfully',
        data: {
          items: [
            {
              id: MOCK_DATA.id.chef,
              name: MOCK_DATA.name.chef,
              image: MOCK_DATA.image.chef,
              bio: 'Experienced pastry chef with 10 years of culinary expertise. Specializes in French pastries and cake decorations.',
              bakery: {
                id: MOCK_DATA.id.bakery,
                name: MOCK_DATA.name.bakery,
              },
              rating: MOCK_DATA.numbers.rating,
              ratingCount: 10,
              createdAt: MOCK_DATA.dates.default,
              updatedAt: MOCK_DATA.dates.default,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  rateChef: {
    request: {
      rating: 5,
      comment: 'Excellent chef! Amazing cakes.',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Chef rated successfully',
        data: {
          id: MOCK_DATA.id.chef,
          name: MOCK_DATA.name.chef,
          rating: 4.9,
          ratingCount: 11,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
