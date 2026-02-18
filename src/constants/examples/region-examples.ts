import { MOCK_DATA } from '../global.constants';

export const RegionExamples = {
  create: {
    request: {
      name: MOCK_DATA.name.region,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Region created successfully',
        data: {
          id: MOCK_DATA.id.region,
          name: MOCK_DATA.name.region,
          image: MOCK_DATA.image.region,
          isAvailable: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      conflict: {
        code: 409,
        success: false,
        message: 'Region with this name already exists',
        error: 'ConflictException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Regions retrieved successfully',
        data: [
          {
            id: MOCK_DATA.id.region,
            name: MOCK_DATA.name.region,
            image: MOCK_DATA.image.region,
            isAvailable: true,
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
        message: 'Region retrieved successfully',
        data: {
          id: MOCK_DATA.id.region,
          name: MOCK_DATA.name.region,
          image: MOCK_DATA.image.region,
          isAvailable: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Region not found',
        error: 'NotFoundException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  update: {
    request: {
      name: 'Alexandria',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Region updated successfully',
        data: {
          id: MOCK_DATA.id.region,
          name: 'Alexandria',
          image: MOCK_DATA.image.region,
          isAvailable: true,
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
        message: 'Region deleted successfully',
        data: {
          message: 'Region deleted successfully',
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getRegionalProducts: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Regional products retrieved successfully',
        data: {
          items: [
            {
              id: 'fc550e84-00e2-9b41-d4a7-16446655440',
              name: 'Classic Cheesecake',
              type: 'featured-cakes',
              price: '1500.00',
              image: MOCK_DATA.image.region,
              description: 'A delicious baked cheesecake',
            },
            {
              id: 'ad660f95-00f3-9c51-e5b8-26557766551',
              name: 'Chocolate Syrup',
              type: 'addons',
              price: '250.00',
            },
            {
              id: 'sw770g06-01g4-0d62-f6c9-37668877662',
              name: 'New York Cheesecake Slice',
              type: 'sweets',
              price: '150.00',
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Region not found',
        error: 'NotFoundException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  deleteRegionalItemPrice: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Regional item price removed',
        data: {
          message: 'Regional item price removed successfully',
        },
        timestamp: MOCK_DATA.dates.default,
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Regional item price not found',
        error: 'NotFoundException',
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
