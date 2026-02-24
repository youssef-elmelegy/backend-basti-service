export const FlavorExamples = {
  create: {
    request: {
      title: 'Chocolate',
      description: 'Rich chocolate flavor with smooth texture and deep cocoa notes',
      flavorUrl:
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
    } as const,
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Flavor created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Chocolate',
          description: 'Rich chocolate flavor with smooth texture and deep cocoa notes',
          flavorUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T10:00:00Z',
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Flavors retrieved successfully',
        data: {
          items: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'Chocolate',
              description: 'Rich chocolate flavor with smooth texture and deep cocoa notes',
              flavorUrl:
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
              createdAt: '2024-02-07T10:00:00Z',
              updatedAt: '2024-02-07T10:00:00Z',
              price: '500',
              variantImages: [
                {
                  id: '223e4567-e89b-12d3-a456-426614174000',
                  sideViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-round-side.jpg',
                  frontViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-round-front.jpg',
                  topViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-round-top.jpg',
                  createdAt: '2024-02-07T10:00:00Z',
                  updatedAt: '2024-02-07T10:00:00Z',
                },
              ],
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              title: 'Vanilla',
              description: 'Classic vanilla flavor with sweet and aromatic notes',
              flavorUrl:
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/vanilla.jpg',
              createdAt: '2024-02-07T09:00:00Z',
              updatedAt: '2024-02-07T09:00:00Z',
              price: '450',
              variantImages: [
                {
                  id: '323e4567-e89b-12d3-a456-426614174001',
                  sideViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/vanilla-round-side.jpg',
                  frontViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/vanilla-round-front.jpg',
                  topViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/vanilla-round-top.jpg',
                  createdAt: '2024-02-07T09:00:00Z',
                  updatedAt: '2024-02-07T09:00:00Z',
                },
              ],
            },
          ],
          pagination: {
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10,
          },
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
  getById: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Flavor retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Chocolate',
          description: 'Rich chocolate flavor with smooth texture and deep cocoa notes',
          flavorUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T10:00:00Z',
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
  update: {
    request: {
      title: 'Dark Chocolate',
      description: 'Premium dark chocolate flavor with intense cocoa taste',
    } as const,
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Flavor updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Dark Chocolate',
          description: 'Premium dark chocolate flavor with intense cocoa taste',
          flavorUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T11:00:00Z',
        },
        timestamp: '2024-02-07T11:00:00Z',
      },
    },
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Flavor deleted successfully',
        data: null,
        timestamp: '2024-02-07T12:00:00Z',
      },
    },
  },
  createRegionItemPrice: {
    request: {
      flavorId: '123e4567-e89b-12d3-a456-426614174000',
      regionId: '550e8400-e29b-41d4-a716-446655440001',
      price: 500,
    } as const,
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Regional pricing created successfully',
        data: {
          id: '789e5678-f90c-12d4-b567-537765285000',
          flavorId: '123e4567-e89b-12d3-a456-426614174000',
          regionId: '550e8400-e29b-41d4-a716-446655440001',
          price: '500',
          createdAt: '2024-02-07T12:30:00Z',
          updatedAt: '2024-02-07T12:30:00Z',
        },
        timestamp: '2024-02-07T12:30:00Z',
      },
    },
  },
  createWithVariantImages: {
    request: {
      title: 'Chocolate',
      description: 'Rich chocolate flavor with smooth texture and deep cocoa notes',
      flavorUrl:
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
      variantImages: [
        {
          shapeId: '223e4567-e89b-12d3-a456-426614174000',
          sideViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-round-side.jpg',
          frontViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-round-front.jpg',
          topViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-round-top.jpg',
        },
        {
          shapeId: '323e4567-e89b-12d3-a456-426614174001',
          sideViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-square-side.jpg',
          frontViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-square-front.jpg',
          topViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/chocolate-square-top.jpg',
        },
      ],
    } as const,
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Flavor and variant images created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Chocolate',
          description: 'Rich chocolate flavor with smooth texture and deep cocoa notes',
          flavorUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T10:00:00Z',
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
} as const;
