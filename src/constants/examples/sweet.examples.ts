export const SweetExamples = {
  create: {
    request: {
      name: 'Chocolate Donut',
      description: 'Delicious chocolate frosted donut with colorful sprinkles and a soft center',
      images: [
        'https://res.cloudinary.com/example/image/upload/v1234567890/basti/sweets/chocolate-donut.jpg',
      ],
      sizes: ['small', 'medium', 'large'],
      tagId: '550e8400-e29b-41d4-a716-446655440000',
      isActive: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Sweet created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Chocolate Donut',
          description:
            'Delicious chocolate frosted donut with colorful sprinkles and a soft center',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Pastries',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/sweets/chocolate-donut.jpg',
          ],
          sizes: ['small', 'medium', 'large'],
          isActive: true,
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
        message: 'Sweets retrieved successfully',
        data: {
          items: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Chocolate Donut',
              description:
                'Delicious chocolate frosted donut with colorful sprinkles and a soft center',
              tagId: '550e8400-e29b-41d4-a716-446655440000',
              tagName: 'Pastries',
              images: [
                'https://res.cloudinary.com/example/image/upload/v1234567890/basti/sweets/chocolate-donut.jpg',
              ],
              sizes: ['small', 'medium', 'large'],
              isActive: true,
              createdAt: '2024-02-07T10:00:00Z',
              updatedAt: '2024-02-07T10:00:00Z',
            },
          ],
          pagination: {
            total: 1,
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
        message: 'Sweet retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Chocolate Donut',
          description:
            'Delicious chocolate frosted donut with colorful sprinkles and a soft center',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Pastries',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/sweets/chocolate-donut.jpg',
          ],
          sizes: ['small', 'medium', 'large'],
          isActive: true,
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T10:00:00Z',
        },
        timestamp: '2024-02-07T10:00:00Z',
      },
    },
  },
  update: {
    request: {
      name: 'Vanilla Donut',
      description: 'Delicious vanilla frosted donut with sprinkles',
      sizes: ['small', 'medium', 'large'],
      isActive: true,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Sweet updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Vanilla Donut',
          description: 'Delicious vanilla frosted donut with sprinkles',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Pastries',
          images: [
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/sweets/vanilla-donut.jpg',
          ],
          sizes: ['small', 'medium', 'large'],
          isActive: true,
          createdAt: '2024-02-07T10:00:00Z',
          updatedAt: '2024-02-07T11:00:00Z',
        },
        timestamp: '2024-02-07T11:00:00Z',
      },
    },
  },
};
