import { MOCK_DATA } from '../global.constants';

export const ChefExamples = {
  create: {
    request: {
      name: MOCK_DATA.name.chef,
      image: MOCK_DATA.image.chef,
      bakeryId: MOCK_DATA.id.bakery,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Chef created successfully',
        data: {
          id: MOCK_DATA.id.chef,
          name: MOCK_DATA.name.chef,
          image: MOCK_DATA.image.chef,
          bakery: {
            id: MOCK_DATA.id.bakery,
            name: MOCK_DATA.name.bakery,
          },
          rating: 0,
          ratingCount: 0,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
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
