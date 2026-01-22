import { MOCK_DATA } from '../global.constants';

export const BakeryExamples = {
  create: {
    request: {
      name: MOCK_DATA.name.bakery,
      locationDescription: '12 El-Maadi St, Cairo',
      regionId: MOCK_DATA.id.region,
      capacity: MOCK_DATA.numbers.capacity,
      bakeryTypes: ['basket_cakes', 'medium_cakes', 'large_cakes'],
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Bakery created successfully',
        data: {
          id: MOCK_DATA.id.bakery,
          name: MOCK_DATA.name.bakery,
          locationDescription: '12 El-Maadi St, Cairo',
          regionId: MOCK_DATA.id.region,
          capacity: MOCK_DATA.numbers.capacity,
          types: ['basket_cakes', 'medium_cakes', 'large_cakes'],
          averageRating: null,
          totalReviews: 0,
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
        message: 'Bakeries retrieved successfully',
        data: [
          {
            id: MOCK_DATA.id.bakery,
            name: MOCK_DATA.name.bakery,
            locationDescription: '12 El-Maadi St, Cairo',
            regionId: MOCK_DATA.id.region,
            capacity: MOCK_DATA.numbers.capacity,
            types: ['basket_cakes', 'medium_cakes', 'large_cakes'],
            averageRating: 4.5,
            totalReviews: 12,
            createdAt: MOCK_DATA.dates.default,
            updatedAt: MOCK_DATA.dates.default,
          },
        ],
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getById: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Bakery retrieved successfully',
        data: {
          id: MOCK_DATA.id.bakery,
          name: MOCK_DATA.name.bakery,
          locationDescription: '12 El-Maadi St, Cairo',
          regionId: MOCK_DATA.id.region,
          capacity: MOCK_DATA.numbers.capacity,
          types: ['basket_cakes', 'medium_cakes', 'large_cakes'],
          averageRating: 4.5,
          totalReviews: 12,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  update: {
    request: {
      name: 'Updated Bakery Name',
      capacity: 25,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Bakery updated successfully',
        data: {
          id: MOCK_DATA.id.bakery,
          name: 'Updated Bakery Name',
          locationDescription: '12 El-Maadi St, Cairo',
          regionId: MOCK_DATA.id.region,
          capacity: 25,
          types: ['basket_cakes', 'medium_cakes', 'large_cakes'],
          averageRating: 4.5,
          totalReviews: 12,
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
        message: 'Bakery deleted successfully',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
