export const ShapeExamples = {
  create: {
    request: {
      title: 'Round',
      description: 'Classic round cake shape perfect for most cake designs',
      shapeUrl:
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Shape created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Round',
          description: 'Classic round cake shape perfect for most cake designs',
          shapeUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Shapes',
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
        message: 'Shapes retrieved successfully',
        data: {
          items: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'Round',
              description: 'Classic round cake shape perfect for most cake designs',
              shapeUrl:
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
              tagId: '550e8400-e29b-41d4-a716-446655440000',
              tagName: 'Shapes',
              createdAt: '2024-02-07T10:00:00Z',
              updatedAt: '2024-02-07T10:00:00Z',
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              title: 'Square',
              description: 'Modern square cake shape great for geometric designs',
              shapeUrl:
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/square.jpg',
              tagId: '550e8400-e29b-41d4-a716-446655440000',
              tagName: 'Shapes',
              createdAt: '2024-02-07T09:00:00Z',
              updatedAt: '2024-02-07T09:00:00Z',
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
        message: 'Shape retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Round',
          description: 'Classic round cake shape perfect for most cake designs',
          shapeUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Shapes',
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T10:00:00Z',
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
  update: {
    request: {
      title: 'Heart',
      description: 'Romantic heart-shaped cake perfect for special occasions',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Shape updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Heart',
          description: 'Romantic heart-shaped cake perfect for special occasions',
          shapeUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Shapes',
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
        message: 'Shape deleted successfully',
        data: null,
        timestamp: '2024-02-07T12:00:00Z',
      },
    },
  },
  createRegionItemPrice: {
    request: {
      shapeId: '123e4567-e89b-12d3-a456-426614174000',
      regionId: '660e8400-e29b-41d4-a716-446655440000',
      price: 15.99,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Regional pricing created successfully',
        data: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          shapeId: '123e4567-e89b-12d3-a456-426614174000',
          regionId: '660e8400-e29b-41d4-a716-446655440000',
          price: 15.99,
          createdAt: '2024-02-07T12:30:00Z',
          updatedAt: '2024-02-07T12:30:00Z',
        },
        timestamp: '2024-02-07T12:30:00Z',
      },
    },
  },
};
