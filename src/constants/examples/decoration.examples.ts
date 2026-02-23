export const DecorationExamples = {
  create: {
    request: {
      title: 'Red Roses',
      description: 'Beautiful fresh red roses for elegant cake decoration',
      decorationUrl:
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
      tagId: '550e8400-e29b-41d4-a716-446655440000',
    } as const,
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Decoration created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Red Roses',
          description: 'Beautiful fresh red roses for elegant cake decoration',
          decorationUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Decorations',
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
        message: 'Decorations retrieved successfully',
        data: {
          items: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'Red Roses',
              description: 'Beautiful fresh red roses for elegant cake decoration',
              decorationUrl:
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
              tagId: '550e8400-e29b-41d4-a716-446655440000',
              tagName: 'Decorations',
              createdAt: '2024-02-07T10:00:00Z',
              updatedAt: '2024-02-07T10:00:00Z',
              price: '300',
              variantImages: [
                {
                  id: '223e4567-e89b-12d3-a456-426614174000',
                  sideViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/red-roses-round-side.jpg',
                  frontViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/red-roses-round-front.jpg',
                  topViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/red-roses-round-top.jpg',
                  createdAt: '2024-02-07T10:00:00Z',
                  updatedAt: '2024-02-07T10:00:00Z',
                },
              ],
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              title: 'White Pearls',
              description: 'Elegant white pearl beads for sophisticated designs',
              decorationUrl:
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/white-pearls.jpg',
              tagId: '550e8400-e29b-41d4-a716-446655440000',
              tagName: 'Decorations',
              createdAt: '2024-02-07T09:00:00Z',
              updatedAt: '2024-02-07T09:00:00Z',
              price: '250',
              variantImages: [
                {
                  id: '323e4567-e89b-12d3-a456-426614174001',
                  sideViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/white-pearls-round-side.jpg',
                  frontViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/white-pearls-round-front.jpg',
                  topViewUrl:
                    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/white-pearls-round-top.jpg',
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
        message: 'Decoration retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Red Roses',
          description: 'Beautiful fresh red roses for elegant cake decoration',
          decorationUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Decorations',
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T10:00:00Z',
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
  update: {
    request: {
      title: 'Gold Leaves',
      description: 'Luxury gold leaf decoration for premium cakes',
    } as const,
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Decoration updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Gold Leaves',
          description: 'Luxury gold leaf decoration for premium cakes',
          decorationUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Decorations',
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
        message: 'Decoration deleted successfully',
        data: null,
        timestamp: '2024-02-07T12:00:00Z',
      },
    },
  },
  createRegionItemPrice: {
    request: {
      decorationId: '123e4567-e89b-12d3-a456-426614174000',
      regionId: '660e8400-e29b-41d4-a716-446655440000',
      price: 8.99,
    } as const,
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Regional pricing created successfully',
        data: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          decorationId: '123e4567-e89b-12d3-a456-426614174000',
          regionId: '660e8400-e29b-41d4-a716-446655440000',
          price: 8.99,
          createdAt: '2024-02-07T12:30:00Z',
          updatedAt: '2024-02-07T12:30:00Z',
        },
        timestamp: '2024-02-07T12:30:00Z',
      },
    },
  },
  createWithVariantImages: {
    request: {
      title: 'Red Roses',
      description: 'Beautiful fresh red roses for elegant cake decoration',
      decorationUrl:
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
      tagId: '550e8400-e29b-41d4-a716-446655440000',
      variantImages: [
        {
          shapeId: '223e4567-e89b-12d3-a456-426614174000',
          sideViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/roses-round-side.jpg',
          frontViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/roses-round-front.jpg',
          topViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/roses-round-top.jpg',
        },
        {
          shapeId: '323e4567-e89b-12d3-a456-426614174001',
          sideViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/roses-square-side.jpg',
          frontViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/roses-square-front.jpg',
          topViewUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/roses-square-top.jpg',
        },
      ],
    } as const,
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Decoration and variant images created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Red Roses',
          description: 'Beautiful fresh red roses for elegant cake decoration',
          decorationUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Decorations',
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T10:00:00Z',
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
} as const;
