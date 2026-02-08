import { MOCK_DATA } from '../global.constants';

export const FeaturedCakeExamples = {
  create: {
    request: {
      name: 'Chocolate Dream Cake',
      description: 'Delicious chocolate cake with rich ganache',
      images: [
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
      ],
      capacity: 12,
      flavorList: ['dark chocolate', 'milk chocolate', 'white chocolate'],
      pipingPaletteList: ['rose gold', 'silver', 'gold'],
      tagId: '550e8400-e29b-41d4-a716-446655440001',
      isActive: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Featured cake created successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
          ],
          capacity: 12,
          flavorList: ['dark chocolate', 'milk chocolate', 'white chocolate'],
          pipingPaletteList: ['rose gold', 'silver', 'gold'],
          tagId: '550e8400-e29b-41d4-a716-446655440001',
          tagName: null,
          isActive: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Featured cakes retrieved successfully',
        data: {
          items: [
            {
              id: MOCK_DATA.id.cake,
              name: 'Chocolate Dream Cake',
              description: 'Delicious chocolate cake with rich ganache',
              images: [
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
              ],
              price: 250,
              capacity: 12,
              flavorList: ['dark chocolate', 'milk chocolate', 'white chocolate'],
              pipingPaletteList: ['rose gold', 'silver', 'gold'],
              tagId: '550e8400-e29b-41d4-a716-446655440001',
              tagName: 'Premium',
              isActive: true,
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
  getById: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Featured cake retrieved successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
          ],
          price: 250,
          capacity: 12,
          flavorList: ['dark chocolate', 'milk chocolate', 'white chocolate'],
          pipingPaletteList: ['rose gold', 'silver', 'gold'],
          tagId: '550e8400-e29b-41d4-a716-446655440001',
          tagName: 'Premium',
          isActive: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  update: {
    request: {
      name: 'Chocolate Dream Cake Updated',
      capacity: 15,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Featured cake updated successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake Updated',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
          ],
          capacity: 15,
          flavorList: ['dark chocolate', 'milk chocolate', 'white chocolate'],
          pipingPaletteList: ['rose gold', 'silver', 'gold'],
          tagId: '550e8400-e29b-41d4-a716-446655440001',
          tagName: 'Premium',
          isActive: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Featured cake deleted successfully',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  toggleStatus: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Featured cake status toggled successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
          ],
          price: 250,
          capacity: 12,
          flavorList: ['dark chocolate', 'milk chocolate', 'white chocolate'],
          pipingPaletteList: ['rose gold', 'silver', 'gold'],
          tagId: '550e8400-e29b-41d4-a716-446655440001',
          tagName: 'Premium',
          isActive: false,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
