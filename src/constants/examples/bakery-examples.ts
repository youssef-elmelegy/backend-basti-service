import { MOCK_DATA } from '../global.constants';

export const BakeryExamples = {
  create: {
    request: {
      name: MOCK_DATA.name.bakery,
      locationDescription: '12 El-Maadi St, Cairo',
      regionId: MOCK_DATA.id.region,
      capacity: MOCK_DATA.numbers.capacity,
      bakeryTypes: ['large_cakes', 'small_cakes', 'others'],
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
  getItemStores: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Bakery item stores retrieved successfully',
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            bakeryId: MOCK_DATA.id.bakery,
            regionItemPriceId: '550e8400-e29b-41d4-a716-446655440002',
            stock: 50,
            price: '150.00',
            sizesPrices: {
              small: '100.00',
              medium: '150.00',
              large: '200.00',
            },
            addonId: '550e8400-e29b-41d4-a716-446655440003',
            featuredCakeId: null,
            sweetId: null,
            decorationId: null,
            flavorId: null,
            shapeId: null,
            predesignedCakeId: null,
            product: {
              id: '550e8400-e29b-41d4-a716-446655440003',
              name: 'Chocolate Sprinkles',
              description: 'Delicious chocolate sprinkles for cake decoration',
              images: ['https://example.com/sprinkles1.jpg'],
              type: 'addon',
            },
            createdAt: MOCK_DATA.dates.default,
            updatedAt: MOCK_DATA.dates.default,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            bakeryId: MOCK_DATA.id.bakery,
            regionItemPriceId: '550e8400-e29b-41d4-a716-446655440005',
            stock: 25,
            price: '350.00',
            sizesPrices: null,
            addonId: null,
            featuredCakeId: '550e8400-e29b-41d4-a716-446655440006',
            sweetId: null,
            decorationId: null,
            flavorId: null,
            shapeId: null,
            predesignedCakeId: null,
            product: {
              id: '550e8400-e29b-41d4-a716-446655440006',
              name: 'Vanilla Dream Cake',
              description: 'Beautiful vanilla featured cake with custom designs',
              images: [
                'https://example.com/vanilla-cake.jpg',
                'https://example.com/vanilla-cake2.jpg',
              ],
              type: 'featured_cake',
            },
            createdAt: MOCK_DATA.dates.default,
            updatedAt: MOCK_DATA.dates.default,
          },
        ],
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  updateItemStock: {
    request: {
      stock: 75,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Stock updated successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          bakeryId: MOCK_DATA.id.bakery,
          regionItemPriceId: '550e8400-e29b-41d4-a716-446655440002',
          stock: 75,
          createdAt: MOCK_DATA.dates.default,
          updatedAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
