import { MOCK_DATA } from '../global.constants';

export const AddExamples = {
  create: {
    request: {
      name: 'Balloon Bundle',
      description: 'Premium balloon bundle with 12 assorted colors',
      images: [
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/adds/balloons.jpg',
      ],
      category: 'balloons',
      price: 50,
      tagId: '550e8400-e29b-41d4-a716-446655440001',
      isActive: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Add-on created successfully',
        data: {
          id: MOCK_DATA.id.add,
          name: 'Balloon Bundle',
          description: 'Premium balloon bundle with 12 assorted colors',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/adds/balloons.jpg',
          ],
          category: 'balloons',
          price: '50',
          tagId: '550e8400-e29b-41d4-a716-446655440001',
          tagName: 'Festive',
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
        message: 'Add-ons retrieved successfully',
        data: {
          items: [
            {
              id: MOCK_DATA.id.add,
              name: 'Balloon Bundle',
              description: 'Premium balloon bundle with 12 assorted colors',
              images: [
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/adds/balloons.jpg',
              ],
              category: 'balloons',
              price: '50',
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
        message: 'Add-on retrieved successfully',
        data: {
          id: MOCK_DATA.id.add,
          name: 'Balloon Bundle',
          description: 'Premium balloon bundle with 12 assorted colors',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/adds/balloons.jpg',
          ],
          category: 'balloons',
          price: '50',
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
      price: 75,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Add-on updated successfully',
        data: {
          id: MOCK_DATA.id.add,
          name: 'Balloon Bundle',
          description: 'Premium balloon bundle with 12 assorted colors',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/adds/balloons.jpg',
          ],
          category: 'candles',
          price: '75',
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
        message: 'Add-on deleted successfully',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  toggleStatus: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Add-on status toggled successfully',
        data: {
          id: MOCK_DATA.id.add,
          name: 'Balloon Bundle',
          description: 'Premium balloon bundle with 12 assorted colors',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/adds/balloons.jpg',
          ],
          category: 'balloons',
          price: '50',
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
