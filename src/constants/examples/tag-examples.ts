export const TagExamples = {
  create: {
    request: {
      name: 'chocolate',
      displayOrder: 1,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Tag created successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'chocolate',
          displayOrder: 1,
          createdAt: '2026-02-08T18:00:00Z',
          updatedAt: '2026-02-08T18:00:00Z',
        },
        timestamp: '2026-02-08T18:00:00Z',
      },
      conflict: {
        message: 'Tag name already exists',
        error: 'Bad Request',
        statusCode: 400,
      },
      displayOrderConflict: {
        message: 'Display order already exists',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Tag deleted successfully',
        data: { message: 'Tag deleted successfully' },
        timestamp: '2026-02-08T18:00:00Z',
      },
      notFound: {
        message: 'Tag not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  },
};
