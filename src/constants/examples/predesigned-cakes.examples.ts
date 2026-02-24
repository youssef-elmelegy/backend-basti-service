export const PredesignedCakesExamples = {
  create: {
    request: {
      name: 'Classic Chocolate Elegance',
      description: 'A beautiful chocolate cake with chocolate frosting and elegant decorations',
      tagId: '550e8400-e29b-41d4-a716-446655440000',
      configs: [
        {
          flavorId: '456f1234-e89b-12d3-a456-426614174001',
          decorationId: '456f1234-e89b-12d3-a456-426614174002',
          shapeId: '456f1234-e89b-12d3-a456-426614174003',
          frostColorValue: '#DC143C',
        },
      ],
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Predesigned cake created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Classic Chocolate Elegance',
          description: 'A beautiful chocolate cake with chocolate frosting and elegant decorations',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Premium',
          configs: [
            {
              id: 'cc567890-ab12-34cd-ef56-789012345678',
              flavor: {
                id: '456f1234-e89b-12d3-a456-426614174001',
                title: 'Chocolate',
                description: 'Rich chocolate flavor with smooth texture',
                flavorUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
                createdAt: '2024-01-15T08:00:00Z',
                updatedAt: '2024-01-15T08:00:00Z',
              },
              decoration: {
                id: '456f1234-e89b-12d3-a456-426614174002',
                title: 'Red Roses',
                description: 'Beautiful red roses for cake decoration',
                decorationUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
                tagId: '550e8400-e29b-41d4-a716-446655440000',
                createdAt: '2024-01-20T08:00:00Z',
                updatedAt: '2024-01-20T08:00:00Z',
              },
              shape: {
                id: '456f1234-e89b-12d3-a456-426614174003',
                title: 'Round',
                description: 'Classic round cake shape',
                shapeUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
                size: 'medium',
                createdAt: '2024-01-10T08:00:00Z',
                updatedAt: '2024-01-10T08:00:00Z',
              },
              frostColorValue: '#DC143C',
              createdAt: '2024-02-01T10:00:00Z',
              updatedAt: '2024-02-01T10:00:00Z',
            },
          ],
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
        message: 'Predesigned cakes retrieved successfully',
        data: {
          items: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Classic Chocolate Elegance',
              description:
                'A beautiful chocolate cake with chocolate frosting and elegant decorations',
              tagId: '550e8400-e29b-41d4-a716-446655440000',
              tagName: 'Premium',
              configs: [
                {
                  id: 'cc567890-ab12-34cd-ef56-789012345678',
                  flavor: {
                    id: '456f1234-e89b-12d3-a456-426614174001',
                    title: 'Chocolate',
                    description: 'Rich chocolate flavor with smooth texture',
                    flavorUrl:
                      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
                    createdAt: '2024-01-15T08:00:00Z',
                    updatedAt: '2024-01-15T08:00:00Z',
                  },
                  decoration: {
                    id: '456f1234-e89b-12d3-a456-426614174002',
                    title: 'Red Roses',
                    description: 'Beautiful red roses for cake decoration',
                    decorationUrl:
                      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
                    tagId: '550e8400-e29b-41d4-a716-446655440000',
                    createdAt: '2024-01-20T08:00:00Z',
                    updatedAt: '2024-01-20T08:00:00Z',
                  },
                  shape: {
                    id: '456f1234-e89b-12d3-a456-426614174003',
                    title: 'Round',
                    description: 'Classic round cake shape',
                    shapeUrl:
                      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
                    size: 'medium',
                    createdAt: '2024-01-10T08:00:00Z',
                    updatedAt: '2024-01-10T08:00:00Z',
                  },
                  frostColorValue: '#DC143C',
                  createdAt: '2024-02-01T10:00:00Z',
                  updatedAt: '2024-02-01T10:00:00Z',
                },
              ],
              isActive: true,
              createdAt: '2024-02-07T10:00:00Z',
              updatedAt: '2024-02-07T10:00:00Z',
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Vanilla Dream',
              description: 'Vanilla cake with vanilla frosting and fresh berries',
              tagId: '550e8400-e29b-41d4-a716-446655440001',
              tagName: 'Classic',
              configs: [
                {
                  id: 'cc567890-ab12-34cd-ef56-789012345679',
                  flavor: {
                    id: '456f1234-e89b-12d3-a456-426614174004',
                    title: 'Vanilla',
                    description: 'Classic vanilla flavor with smooth vanilla cream',
                    flavorUrl:
                      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/vanilla.jpg',
                    createdAt: '2024-01-15T08:00:00Z',
                    updatedAt: '2024-01-15T08:00:00Z',
                  },
                  decoration: {
                    id: '456f1234-e89b-12d3-a456-426614174005',
                    title: 'Fresh Berries',
                    description: 'Fresh mixed berries for decoration',
                    decorationUrl:
                      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/berries.jpg',
                    tagId: null,
                    createdAt: '2024-01-20T08:00:00Z',
                    updatedAt: '2024-01-20T08:00:00Z',
                  },
                  shape: {
                    id: '456f1234-e89b-12d3-a456-426614174006',
                    title: 'Square',
                    description: 'Modern square cake shape',
                    shapeUrl:
                      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/square.jpg',
                    size: 'large',
                    createdAt: '2024-01-10T08:00:00Z',
                    updatedAt: '2024-01-10T08:00:00Z',
                  },
                  frostColorValue: '#F5DEB3',
                  createdAt: '2024-02-01T10:00:00Z',
                  updatedAt: '2024-02-01T10:00:00Z',
                },
              ],
              isActive: true,
              createdAt: '2024-02-07T09:00:00Z',
              updatedAt: '2024-02-07T09:00:00Z',
            },
          ],
          pagination: {
            total: 2,
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
        message: 'Predesigned cake retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Classic Chocolate Elegance',
          description: 'A beautiful chocolate cake with chocolate frosting and elegant decorations',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Premium',
          configs: [
            {
              id: 'cc567890-ab12-34cd-ef56-789012345678',
              flavor: {
                id: '456f1234-e89b-12d3-a456-426614174001',
                title: 'Chocolate',
                description: 'Rich chocolate flavor with smooth texture',
                flavorUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
                createdAt: '2024-01-15T08:00:00Z',
                updatedAt: '2024-01-15T08:00:00Z',
              },
              decoration: {
                id: '456f1234-e89b-12d3-a456-426614174002',
                title: 'Red Roses',
                description: 'Beautiful red roses for cake decoration',
                decorationUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
                tagId: '550e8400-e29b-41d4-a716-446655440000',
                createdAt: '2024-01-20T08:00:00Z',
                updatedAt: '2024-01-20T08:00:00Z',
              },
              shape: {
                id: '456f1234-e89b-12d3-a456-426614174003',
                title: 'Round',
                description: 'Classic round cake shape',
                shapeUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
                size: 'medium',
                createdAt: '2024-01-10T08:00:00Z',
                updatedAt: '2024-01-10T08:00:00Z',
              },
              frostColorValue: '#DC143C',
              createdAt: '2024-02-01T10:00:00Z',
              updatedAt: '2024-02-01T10:00:00Z',
            },
          ],
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
      name: 'Premium Chocolate Elegance',
      description: 'Premium chocolate cake with premium frosting and premium decorations',
      configs: [
        {
          flavorId: '456f1234-e89b-12d3-a456-426614174001',
          decorationId: '456f1234-e89b-12d3-a456-426614174002',
          shapeId: '456f1234-e89b-12d3-a456-426614174003',
          frostColorValue: '#C71585',
        },
      ],
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Predesigned cake updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Premium Chocolate Elegance',
          description: 'Premium chocolate cake with premium frosting and premium decorations',
          tagId: '550e8400-e29b-41d4-a716-446655440000',
          tagName: 'Premium',
          configs: [
            {
              id: 'cc567890-ab12-34cd-ef56-789012345678',
              flavor: {
                id: '456f1234-e89b-12d3-a456-426614174001',
                title: 'Chocolate',
                description: 'Rich chocolate flavor with smooth texture',
                flavorUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
                createdAt: '2024-01-15T08:00:00Z',
                updatedAt: '2024-01-15T08:00:00Z',
              },
              decoration: {
                id: '456f1234-e89b-12d3-a456-426614174002',
                title: 'Red Roses',
                description: 'Beautiful red roses for cake decoration',
                decorationUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
                tagId: '550e8400-e29b-41d4-a716-446655440000',
                createdAt: '2024-01-20T08:00:00Z',
                updatedAt: '2024-01-20T08:00:00Z',
              },
              shape: {
                id: '456f1234-e89b-12d3-a456-426614174003',
                title: 'Round',
                description: 'Classic round cake shape',
                shapeUrl:
                  'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
                size: 'medium',
                createdAt: '2024-01-10T08:00:00Z',
                updatedAt: '2024-01-10T08:00:00Z',
              },
              frostColorValue: '#DC143C',
              createdAt: '2024-02-01T10:00:00Z',
              updatedAt: '2024-02-01T10:00:00Z',
            },
          ],
          isActive: true,
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
        message: 'Predesigned cake deleted successfully',
        data: null,
        timestamp: '2024-02-07T12:00:00Z',
      },
    },
  },
  checkAvailability: {
    request: {
      regionId: '550e8400-e29b-41d4-a716-446655440001',
      entityId: '123e4567-e89b-12d3-a456-426614174000',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Entity availability checked successfully',
        data: {
          flavorAvailable: true,
          shapeAvailable: true,
          decorationAvailable: false,
          entityId: '123e4567-e89b-12d3-a456-426614174000',
          regionId: '550e8400-e29b-41d4-a716-446655440001',
        },
        timestamp: '2024-02-07T12:30:00Z',
      },
    },
  },
  createRegionItemPrice: {
    request: {
      create: {
        predesignedCakeId: '123e4567-e89b-12d3-a456-426614174000',
        regionId: '550e8400-e29b-41d4-a716-446655440001',
        price: 250.99,
      },
      update: {
        predesignedCakeId: '123e4567-e89b-12d3-a456-426614174000',
        regionId: '550e8400-e29b-41d4-a716-446655440001',
        price: 275.5,
      },
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Predesigned cake region price created successfully',
        data: {
          id: '789e5678-f90c-12d4-b567-537765285000',
          predesignedCakeId: '123e4567-e89b-12d3-a456-426614174000',
          regionId: '550e8400-e29b-41d4-a716-446655440001',
          price: '250.99',
          createdAt: '2024-02-07T12:30:00Z',
          updatedAt: '2024-02-07T12:30:00Z',
        },
        timestamp: '2024-02-07T12:30:00Z',
      },
      updated: {
        code: 200,
        success: true,
        message: 'Predesigned cake region price updated successfully',
        data: {
          id: '789e5678-f90c-12d4-b567-537765285000',
          predesignedCakeId: '123e4567-e89b-12d3-a456-426614174000',
          regionId: '550e8400-e29b-41d4-a716-446655440001',
          price: '275.50',
          createdAt: '2024-02-07T12:30:00Z',
          updatedAt: '2024-02-07T13:00:00Z',
        },
        timestamp: '2024-02-07T13:00:00Z',
      },
    },
  },
};
