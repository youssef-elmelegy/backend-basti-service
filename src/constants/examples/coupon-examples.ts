import { MOCK_DATA } from '../global.constants';

export const CouponExamples = {
  generate: {
    request: {
      code: 'BASTY20',
      name: 'Basty 20% off',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 50,
      startDate: MOCK_DATA.dates.default,
      expiryDate: '2027-11-27T10:00:00.000Z',
      usageLimitGlobal: 100,
      usageLimitPerUser: 1,
      isGlobal: true,
      isActive: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'routes.coupons.created',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          code: 'BASTY20',
          name: 'Basty 20% off',
          discountType: 'percentage',
          discountValue: 20,
          minOrderValue: 50,
          startDate: MOCK_DATA.dates.default,
          expiryDate: '2027-11-27T10:00:00.000Z',
          usageLimitGlobal: 100,
          usageLimitPerUser: 1,
          isGlobal: true,
          isActive: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  verify: {
    request: {
      code: 'BASTY20',
      regionId: '660e8400-e29b-41d4-a716-446655440001',
      userId: '660e8400-e29b-41d4-a716-446655440001',
      cartTotal: 100,
      
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'routes.coupons.verify',
        data: {
          message: 'routes.coupons.verify',
        },
        timestamp: MOCK_DATA.dates.default,
      }
    }
  },
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'routes.coupons.list_retrieved',
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            code: 'BASTY20',
            name: 'Basty 20% off',
            discountType: 'percentage',
            discountValue: 20,
            minOrderValue: 50,
            startDate: MOCK_DATA.dates.default,
            expiryDate: '2027-11-27T10:00:00.000Z',
            usageLimitGlobal: 100,
            usageLimitPerUser: 1,
            isGlobal: true,
            isActive: true,
            createdAt: MOCK_DATA.dates.default,
            updatedAt: MOCK_DATA.dates.default,
          }
        ],
        timestamp: MOCK_DATA.dates.default,
      }
    }
  },
  getById: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'routes.coupons.retrieved',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          code: 'BASTY20',
          name: 'Basty 20% off',
          discountType: 'percentage',
          discountValue: 20,
          minOrderValue: 50,
          startDate: MOCK_DATA.dates.default,
          expiryDate: '2027-11-27T10:00:00.000Z',
          usageLimitGlobal: 100,
          usageLimitPerUser: 1,
          isGlobal: true,
          isActive: true,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      }
    }
  },
  update: {
    request: {
      isActive: false,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'routes.coupons.updated',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          code: 'BASTY20',
          name: 'Basty 20% off',
          discountType: 'percentage',
          discountValue: 20,
          minOrderValue: 50,
          startDate: MOCK_DATA.dates.default,
          expiryDate: '2027-11-27T10:00:00.000Z',
          usageLimitGlobal: 100,
          usageLimitPerUser: 1,
          isGlobal: true,
          isActive: false,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      }
    }
  },
  toggleStatus: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'routes.coupons.toggled',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          code: 'BASTY20',
          name: 'Basty 20% off',
          discountType: 'percentage',
          discountValue: 20,
          minOrderValue: 50,
          startDate: MOCK_DATA.dates.default,
          expiryDate: '2027-11-27T10:00:00.000Z',
          usageLimitGlobal: 100,
          usageLimitPerUser: 1,
          isGlobal: true,
          isActive: false,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      }
    }
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Coupon deleted successfully',
        data: {
            message: 'routes.coupons.deleted'
        },
        timestamp: MOCK_DATA.dates.default,
      }
    }
  }
};
