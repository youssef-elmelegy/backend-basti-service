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
} as const;
