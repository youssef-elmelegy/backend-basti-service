import { MOCK_DATA } from '../global.constants';

const MOCK_IDS = {
  cartItem: MOCK_DATA.id.cartItem,
  user: MOCK_DATA.id.user,
  addon: MOCK_DATA.id.add,
  sweet: 'dd0e8400-e29b-41d4-a716-446655440009',
  featuredCake: MOCK_DATA.id.cake,
  predesignedCake: '123e4567-e89b-12d3-a456-426614174000',
  customCakeCartItem: 'ee0e8400-e29b-41d4-a716-446655440010',
  flavor: '456f1234-e89b-12d3-a456-426614174001',
  decoration: '456f1234-e89b-12d3-a456-426614174002',
  shape: '456f1234-e89b-12d3-a456-426614174003',
  tag: '550e8400-e29b-41d4-a716-446655440001',
};

const addonItem = {
  id: MOCK_IDS.addon,
  name: 'Balloon Bundle',
  description: 'Premium balloon bundle with 12 assorted colors',
  images: ['https://res.cloudinary.com/example/image/upload/v1234567890/basti/addons/balloons.jpg'],
  category: 'balloons',
  tagId: MOCK_IDS.tag,
  tagName: 'Premium',
  isActive: true,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

const sweetItem = {
  id: MOCK_IDS.sweet,
  name: 'Chocolate Truffle Box',
  description: 'Assorted chocolate truffles in a premium box',
  tagId: MOCK_IDS.tag,
  tagName: 'Premium',
  images: ['https://res.cloudinary.com/example/image/upload/v1234567890/basti/sweets/truffles.jpg'],
  sizes: ['Small', 'Medium', 'Large'],
  isActive: true,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

const featuredCakeItem = {
  id: MOCK_IDS.featuredCake,
  name: 'Chocolate Dream Cake',
  description: 'Delicious chocolate cake with rich ganache',
  images: [
    'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
  ],
  capacity: 12,
  flavorList: ['Chocolate', 'Vanilla', 'Strawberry'],
  pipingPaletteList: ['Gold', 'Silver', 'Rose Gold'],
  tagId: MOCK_IDS.tag,
  tagName: 'Premium',
  isActive: true,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

const predesignedCakeItem = {
  id: MOCK_IDS.predesignedCake,
  name: 'Classic Chocolate Elegance',
  description: 'A beautiful chocolate cake with chocolate frosting and elegant decorations',
  tagId: MOCK_IDS.tag,
  tagName: 'Premium',
  isActive: true,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
  configs: [
    {
      id: 'cc567890-ab12-34cd-ef56-789012345678',
      flavor: {
        id: MOCK_IDS.flavor,
        title: 'Chocolate',
        description: 'Rich chocolate flavor with smooth texture',
        flavorUrl:
          'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
      decoration: {
        id: MOCK_IDS.decoration,
        title: 'Red Roses',
        description: 'Beautiful red roses for cake decoration',
        decorationUrl:
          'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
        tagId: MOCK_IDS.tag,
        tagName: 'Premium',
        createdAt: '2024-01-20T08:00:00Z',
        updatedAt: '2024-01-20T08:00:00Z',
      },
      shape: {
        id: MOCK_IDS.shape,
        title: 'Round',
        description: 'Classic round cake shape',
        shapeUrl:
          'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z',
      },
      frostColorValue: '#DC143C',
      createdAt: '2024-02-01T10:00:00Z',
      updatedAt: '2024-02-01T10:00:00Z',
    },
  ],
};

const customCakeItem = {
  configs: [
    {
      flavor: {
        id: MOCK_IDS.flavor,
        title: 'Chocolate',
        description: 'Rich chocolate flavor with smooth texture',
        flavorUrl:
          'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
      decoration: {
        id: MOCK_IDS.decoration,
        title: 'Red Roses',
        description: 'Beautiful red roses for cake decoration',
        decorationUrl:
          'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
        tagId: MOCK_IDS.tag,
        tagName: 'Premium',
        createdAt: '2024-01-20T08:00:00Z',
        updatedAt: '2024-01-20T08:00:00Z',
      },
      shape: {
        id: MOCK_IDS.shape,
        title: 'Round',
        description: 'Classic round cake shape',
        shapeUrl:
          'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-10T08:00:00Z',
      },
      frostColorValue: '#DC143C',
    },
  ],
};

const fullCartData = {
  bigCakes: {
    featuredCakes: [
      {
        quantity: 1,
        isIncluded: true,
        type: 'big_cakes',
        item: featuredCakeItem,
      },
    ],
    predesignedCake: [
      {
        quantity: 1,
        isIncluded: true,
        type: 'big_cakes',
        item: predesignedCakeItem,
      },
    ],
    customCakes: [
      {
        quantity: 1,
        isIncluded: true,
        type: 'big_cakes',
        item: customCakeItem,
      },
    ],
  },
  smallCakes: {
    featuredCakes: [],
    predesignedCake: [],
    customCakes: [],
  },
  others: {
    sweets: [
      {
        quantity: 2,
        isIncluded: true,
        type: 'others',
        item: sweetItem,
      },
    ],
    addons: [
      {
        quantity: 3,
        isIncluded: true,
        type: 'others',
        item: addonItem,
      },
    ],
  },
};

const emptyCartData = {
  bigCakes: {
    featuredCakes: [],
    predesignedCake: [],
    customCakes: [],
  },
  smallCakes: {
    featuredCakes: [],
    predesignedCake: [],
    customCakes: [],
  },
  others: {
    sweets: [],
    addons: [],
  },
};

export const CartExamples = {
  getAllCartItems: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Cart items retrieved successfully',
        data: fullCartData,
        timestamp: MOCK_DATA.dates.default,
      },
      empty: {
        code: 200,
        success: true,
        message: 'Cart items retrieved successfully',
        data: emptyCartData,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  addAddon: {
    request: {
      addonId: MOCK_IDS.addon,
      quantity: 3,
      isIncluded: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Addon added to cart successfully',
        data: {
          ...emptyCartData,
          others: {
            sweets: [],
            addons: [
              {
                quantity: 3,
                isIncluded: true,
                type: 'others',
                item: addonItem,
              },
            ],
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  addSweet: {
    request: {
      sweetId: MOCK_IDS.sweet,
      quantity: 2,
      isIncluded: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Sweet added to cart successfully',
        data: {
          ...emptyCartData,
          others: {
            sweets: [
              {
                quantity: 2,
                isIncluded: true,
                type: 'others',
                item: sweetItem,
              },
            ],
            addons: [],
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  addFeaturedCake: {
    request: {
      featuredCakeId: MOCK_IDS.featuredCake,
      quantity: 1,
      isIncluded: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Featured cake added to cart successfully',
        data: {
          bigCakes: {
            featuredCakes: [
              {
                quantity: 1,
                isIncluded: true,
                type: 'big_cakes',
                item: featuredCakeItem,
              },
            ],
            predesignedCake: [],
            customCakes: [],
          },
          smallCakes: {
            featuredCakes: [],
            predesignedCake: [],
            customCakes: [],
          },
          others: {
            sweets: [],
            addons: [],
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  addPredesignedCake: {
    request: {
      predesignedCakeId: MOCK_IDS.predesignedCake,
      quantity: 1,
      isIncluded: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Predesigned cake added to cart successfully',
        data: {
          bigCakes: {
            featuredCakes: [],
            predesignedCake: [
              {
                quantity: 1,
                isIncluded: true,
                type: 'big_cakes',
                item: predesignedCakeItem,
              },
            ],
            customCakes: [],
          },
          smallCakes: {
            featuredCakes: [],
            predesignedCake: [],
            customCakes: [],
          },
          others: {
            sweets: [],
            addons: [],
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  addCustomCake: {
    request: {
      customCakeConfigs: [
        {
          shapeId: MOCK_IDS.shape,
          flavorId: MOCK_IDS.flavor,
          decorationId: MOCK_IDS.decoration,
          frostColorValue: '#DC143C',
        },
      ],
      quantity: 1,
      isIncluded: true,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Custom cake added to cart successfully',
        data: {
          bigCakes: {
            featuredCakes: [],
            predesignedCake: [],
            customCakes: [
              {
                quantity: 1,
                isIncluded: true,
                type: 'big_cakes',
                item: customCakeItem,
              },
            ],
          },
          smallCakes: {
            featuredCakes: [],
            predesignedCake: [],
            customCakes: [],
          },
          others: {
            sweets: [],
            addons: [],
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  deleteCartItem: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Cart item deleted successfully',
        data: emptyCartData,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  toggleCartItem: {
    request: {
      isIncluded: false,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Cart item toggled successfully',
        data: {
          ...emptyCartData,
          others: {
            sweets: [],
            addons: [
              {
                quantity: 3,
                isIncluded: false,
                type: 'others',
                item: addonItem,
              },
            ],
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  updateQuantity: {
    request: {
      quantity: 5,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Cart item quantity updated successfully',
        data: {
          ...emptyCartData,
          others: {
            sweets: [],
            addons: [
              {
                quantity: 5,
                isIncluded: true,
                type: 'others',
                item: addonItem,
              },
            ],
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  bulkDeleteCartItems: {
    request: {
      ids: [MOCK_IDS.cartItem, MOCK_IDS.addon],
      regionId: MOCK_DATA.id.region,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Cart items deleted successfully',
        data: emptyCartData,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
