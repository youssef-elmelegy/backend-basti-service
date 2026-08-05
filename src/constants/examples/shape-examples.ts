export const ShapeExamples = {
  create: {
    request: {
      title: 'Round',
      description: 'Classic round cake shape perfect for most cake designs',
      shapeUrl:
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
      size: 'medium',
      capacity: 20,
      minPrepHours: 24,
      visualKey: 'classic_round',
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
          size: 'medium',
          capacity: 20,
          order: 1,
          minPrepHours: 24,
          visualKey: 'classic_round',
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
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Round',
            description: 'Classic round cake shape perfect for most cake designs',
            shapeUrl:
              'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
            size: 'medium',
            capacity: 20,
            order: 1,
            minPrepHours: 24,
            visualKey: 'classic_round',
            createdAt: '2024-02-07T10:00:00Z',
            updatedAt: '2024-02-07T10:00:00Z',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Square',
            description: 'Modern square cake shape great for geometric designs',
            shapeUrl:
              'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/square.jpg',
            size: 'large',
            capacity: 30,
            order: 2,
            minPrepHours: 0,
            visualKey: 'big_heart',
            createdAt: '2024-02-07T09:00:00Z',
            updatedAt: '2024-02-07T09:00:00Z',
          },
        ],
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
          size: 'medium',
          capacity: 20,
          order: 1,
          minPrepHours: 24,
          visualKey: 'classic_round',
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
      size: 'small',
      capacity: 15,
      minPrepHours: 12,
      visualKey: 'small_heart',
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
          size: 'small',
          capacity: 15,
          order: 1,
          minPrepHours: 12,
          visualKey: 'small_heart',
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
      conflict: {
        code: 409,
        success: false,
        message: 'Cannot delete shape because it is used in predesigned cake configurations',
        data: {
          relatedConfigsCount: 3,
          affectedPredesignedCakesCount: 2,
          affectedPredesignedCakeIds: [
            '550e8400-e29b-41d4-a716-446655440010',
            '550e8400-e29b-41d4-a716-446655440011',
          ],
        },
        timestamp: '2024-02-07T12:00:00Z',
      },
    },
  },
  forceDelete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Shape and related records deleted successfully',
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
  changeOrder: {
    request: {
      order: 2,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Shape order updated successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Square',
            description: 'Modern square cake shape great for geometric designs',
            shapeUrl:
              'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/square.jpg',
            size: 'large',
            capacity: 30,
            order: 1,
            minPrepHours: 0,
            visualKey: 'big_heart',
            createdAt: '2024-02-07T09:00:00Z',
            updatedAt: '2024-02-07T09:00:00Z',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Round',
            description: 'Classic round cake shape perfect for most cake designs',
            shapeUrl:
              'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
            size: 'medium',
            capacity: 20,
            order: 2,
            minPrepHours: 24,
            visualKey: 'classic_round',
            createdAt: '2024-02-07T10:00:00Z',
            updatedAt: '2024-02-07T10:00:00Z',
          },
        ],
        timestamp: '2024-02-07T10:00:00Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Shape not found',
        error: 'NotFoundException',
        timestamp: '2024-02-07T10:00:00Z',
      },
      badRequest: {
        code: 400,
        success: false,
        message: 'Order must be at least 1',
        error: 'BadRequestException',
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
};
