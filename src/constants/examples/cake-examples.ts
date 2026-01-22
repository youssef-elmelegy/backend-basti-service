import { MOCK_DATA } from '../global.constants';

export const CakeExamples = {
  create: {
    request: {
      name: 'Chocolate Dream Cake',
      description: 'Delicious chocolate cake with rich ganache',
      images: [
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/cakes/chocolate.jpg',
      ],
      mainPrice: 250,
      capacity: 12,
      tags: ['chocolate', 'classic', 'premium'],
      flavors: ['dark chocolate', 'milk chocolate'],
      sizes: [
        { size: 'small', price: 150 },
        { size: 'medium', price: 250 },
        { size: 'large', price: 400 },
      ],
      isActive: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Cake created successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/cakes/chocolate.jpg',
          ],
          mainPrice: '250',
          capacity: 12,
          tags: ['chocolate', 'classic', 'premium'],
          flavors: ['dark chocolate', 'milk chocolate'],
          sizes: [
            { size: 'small', price: '150' },
            { size: 'medium', price: '250' },
            { size: 'large', price: '400' },
          ],
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
        message: 'Cakes retrieved successfully',
        data: {
          items: [
            {
              id: MOCK_DATA.id.cake,
              name: 'Chocolate Dream Cake',
              description: 'Delicious chocolate cake with rich ganache',
              images: [
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/cakes/chocolate.jpg',
              ],
              mainPrice: '250',
              capacity: 12,
              tags: ['chocolate', 'classic', 'premium'],
              flavors: ['dark chocolate', 'milk chocolate'],
              sizes: [
                { size: 'small', price: '150' },
                { size: 'medium', price: '250' },
                { size: 'large', price: '400' },
              ],
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
        message: 'Cake retrieved successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/cakes/chocolate.jpg',
          ],
          mainPrice: '250',
          capacity: 12,
          tags: ['chocolate', 'classic', 'premium'],
          flavors: ['dark chocolate', 'milk chocolate'],
          sizes: [
            { size: 'small', price: '150' },
            { size: 'medium', price: '250' },
            { size: 'large', price: '400' },
          ],
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
      mainPrice: 280,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Cake updated successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake Updated',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/cakes/chocolate.jpg',
          ],
          mainPrice: '280',
          capacity: 12,
          tags: ['chocolate', 'classic', 'premium'],
          flavors: ['dark chocolate', 'milk chocolate'],
          sizes: [
            { size: 'small', price: '150' },
            { size: 'medium', price: '280' },
            { size: 'large', price: '400' },
          ],
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
        message: 'Cake deleted successfully',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  toggleStatus: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Cake status toggled successfully',
        data: {
          id: MOCK_DATA.id.cake,
          name: 'Chocolate Dream Cake',
          description: 'Delicious chocolate cake with rich ganache',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/cakes/chocolate.jpg',
          ],
          mainPrice: '250',
          capacity: 12,
          tags: ['chocolate', 'classic', 'premium'],
          flavors: ['dark chocolate', 'milk chocolate'],
          sizes: [
            { size: 'small', price: '150' },
            { size: 'medium', price: '250' },
            { size: 'large', price: '400' },
          ],
          isActive: false,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
