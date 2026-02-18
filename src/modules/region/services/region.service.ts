import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { regions, regionItemPrices } from '@/db/schema';
import { eq, asc, desc, SQL, and } from 'drizzle-orm';
import {
  CreateRegionDto,
  UpdateRegionDto,
  RegionResponse,
  GetRegionsQueryDto,
  GetRegionalProductsQueryDto,
  ProductTypeFilter,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { FeaturedCakeService } from '@/modules/featured-cake/services/featured-cake.service';
import { AddonService } from '@/modules/addon/services/addon.service';
import { SweetService } from '@/modules/sweet/services/sweet.service';
import { FlavorService } from '@/modules/custom-cakes/services/flavor.service';
import { ShapeService } from '@/modules/custom-cakes/services/shape.service';
import { DecorationService } from '@/modules/custom-cakes/services/decoration.service';
import { PredesignedCakesService } from '@/modules/custom-cakes/services/predesigned-cakes.service';
import { SortBy } from '@/modules/sweet/dto';
import { FlavorSortBy } from '@/modules/custom-cakes/dto';
import { ShapeSortBy } from '@/modules/custom-cakes/dto';
import { DecorationSortBy } from '@/modules/custom-cakes/dto';

interface RegionalProduct {
  [key: string]: unknown;
}

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);

  constructor(
    private readonly featuredCakeService: FeaturedCakeService,
    private readonly addonService: AddonService,
    private readonly sweetService: SweetService,
    private readonly flavorService: FlavorService,
    private readonly shapeService: ShapeService,
    private readonly decorationService: DecorationService,
    private readonly predesignedCakesService: PredesignedCakesService,
  ) {}

  async create(createRegionDto: CreateRegionDto): Promise<SuccessResponse<RegionResponse>> {
    const { name, image, isAvailable } = createRegionDto;

    const existingRegion = await db.select().from(regions).where(eq(regions.name, name)).limit(1);

    if (existingRegion.length > 0) {
      this.logger.warn(`Region creation failed: Name already exists - ${name}`);
      throw new ConflictException(
        errorResponse(
          'Region with this name already exists',
          HttpStatus.CONFLICT,
          'ConflictException',
        ),
      );
    }

    try {
      const [newRegion] = await db.insert(regions).values({ name, image, isAvailable }).returning();

      this.logger.log(`Region created: ${newRegion.id} (${name})`);

      return successResponse(
        {
          id: newRegion.id,
          name: newRegion.name,
          image: newRegion.image,
          isAvailable: newRegion.isAvailable,
          createdAt: newRegion.createdAt,
          updatedAt: newRegion.updatedAt,
        },
        'Region created successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Region creation error for ${name}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create region',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(query?: GetRegionsQueryDto): Promise<SuccessResponse<RegionResponse[]>> {
    try {
      const orderByConditions: SQL[] = [];
      if (query?.sort) {
        const sortFn = query.order === 'desc' ? desc : asc;
        if (query.sort === 'created_at') {
          orderByConditions.push(sortFn(regions.createdAt));
        } else if (query.sort === 'alpha') {
          orderByConditions.push(sortFn(regions.name));
        }
      }

      const filter: SQL[] = [];
      if (query.isAvailable !== undefined && query.isAvailable !== null) {
        filter.push(eq(regions.isAvailable, query.isAvailable));
      }

      const allRegions =
        orderByConditions.length > 0
          ? await db
              .select()
              .from(regions)
              .where(and(...filter))
              .orderBy(...orderByConditions)
          : await db.select().from(regions);

      this.logger.debug(`Retrieved ${allRegions.length} regions`);

      return successResponse(
        allRegions.map((region) => ({
          id: region.id,
          name: region.name,
          image: region.image,
          isAvailable: region.isAvailable,
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
        })),
        'Regions retrieved successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error('Failed to retrieve regions');
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve regions',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<RegionResponse>> {
    const [region] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);

    if (!region) {
      this.logger.warn(`Region not found: ${id}`);
      throw new NotFoundException(
        errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Region retrieved: ${id}`);

    return successResponse(
      {
        id: region.id,
        name: region.name,
        image: region.image,
        isAvailable: region.isAvailable,
        createdAt: region.createdAt,
        updatedAt: region.updatedAt,
      },
      'Region retrieved successfully',
      HttpStatus.OK,
    );
  }

  async update(
    id: string,
    updateRegionDto: UpdateRegionDto,
  ): Promise<SuccessResponse<RegionResponse>> {
    const { name, image, isAvailable } = updateRegionDto;

    const [existingRegion] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);

    if (!existingRegion) {
      this.logger.warn(`Region update failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (name) {
      const [duplicateRegion] = await db
        .select()
        .from(regions)
        .where(eq(regions.name, name))
        .limit(1);

      if (duplicateRegion && duplicateRegion.id !== id) {
        this.logger.warn(`Region update failed: Name already exists - ${name}`);
        throw new ConflictException(
          errorResponse(
            'Region with this name already exists',
            HttpStatus.CONFLICT,
            'ConflictException',
          ),
        );
      }
    }

    try {
      const [updatedRegion] = await db
        .update(regions)
        .set({
          ...(name && { name }),
          ...(image && { image }),
          ...(isAvailable !== undefined && { isAvailable }),
          updatedAt: new Date(),
        })
        .where(eq(regions.id, id))
        .returning();

      this.logger.log(`Region updated: ${id}`);

      return successResponse(
        {
          id: updatedRegion.id,
          name: updatedRegion.name,
          image: updatedRegion.image,
          isAvailable: updatedRegion.isAvailable,
          createdAt: updatedRegion.createdAt,
          updatedAt: updatedRegion.updatedAt,
        },
        'Region updated successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Region update error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update region',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    const [existingRegion] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);

    if (!existingRegion) {
      this.logger.warn(`Region deletion failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    try {
      await db.delete(regions).where(eq(regions.id, id));

      this.logger.log(`Region deleted: ${id}`);

      return successResponse(
        { message: 'Region deleted successfully' },
        'Region deleted successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Region deletion error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete region',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
  async getRegionalProducts(
    regionId: string,
    query: GetRegionalProductsQueryDto,
  ): Promise<
    SuccessResponse<{
      items: RegionalProduct[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>
  > {
    const { page: queryPage = 1, limit: queryLimit = 10, types } = query;

    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 10;

    try {
      const region = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);

      if (!region.length) {
        this.logger.warn(`Region not found: ${regionId}`);
        throw new NotFoundException(
          errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      // Get all product types if none specified, otherwise use filtered types
      const productTypesToFetch: ProductTypeFilter[] =
        types && types.length > 0 ? types : Object.values(ProductTypeFilter);

      const allProducts: RegionalProduct[] = [];

      // Fetch products from each service based on type
      for (const type of productTypesToFetch) {
        try {
          let products: RegionalProduct[] = [];

          switch (type) {
            case ProductTypeFilter.FEATURED_CAKE: {
              const featuredCakesResponse = await this.featuredCakeService.findAll({
                page: 1,
                limit: 1000,
                regionId,
              });
              if (featuredCakesResponse.data && 'items' in featuredCakesResponse.data) {
                const cakes = (
                  featuredCakesResponse.data as {
                    items: Record<string, unknown>[];
                  }
                ).items;
                products = cakes.map((cake) => ({
                  ...cake,
                  type: ProductTypeFilter.FEATURED_CAKE,
                })) as RegionalProduct[];
              }
              break;
            }

            case ProductTypeFilter.ADDON: {
              const addonsResponse = await this.addonService.findAll({
                page: 1,
                limit: 1000,
                regionId,
                tag: undefined,
                category: undefined,
                isActive: undefined,
              });
              if (addonsResponse.data && 'items' in addonsResponse.data) {
                const addonItems = (
                  addonsResponse.data as {
                    items: Record<string, unknown>[];
                  }
                ).items;
                products = addonItems.map((addon) => ({
                  ...addon,
                  type: ProductTypeFilter.ADDON,
                })) as RegionalProduct[];
              }
              break;
            }

            case ProductTypeFilter.SWEET: {
              const sweetsResponse = await this.sweetService.findAll({
                page: 1,
                limit: 1000,
                regionId,
                sortBy: SortBy.CREATED_AT,
                order: 'desc',
              });
              if (sweetsResponse.data) {
                const sweetData = sweetsResponse.data as unknown as {
                  items: Record<string, unknown>[];
                };
                if ('items' in sweetData) {
                  const sweetItems = sweetData.items;
                  products = sweetItems.map((sweet) => ({
                    ...sweet,
                    type: ProductTypeFilter.SWEET,
                  })) as RegionalProduct[];
                }
              }
              break;
            }

            case ProductTypeFilter.FLAVOR: {
              const flavorsResponse = await this.flavorService.findAll({
                page: 1,
                limit: 1000,
                regionId,
                sortBy: FlavorSortBy.CREATED_AT,
                order: 'desc',
              });
              if (flavorsResponse.data) {
                const flavorData = flavorsResponse.data as unknown as {
                  items: Record<string, unknown>[];
                };
                if ('items' in flavorData) {
                  const flavorItems = flavorData.items;
                  products = flavorItems.map((flavor) => ({
                    ...flavor,
                    type: ProductTypeFilter.FLAVOR,
                  })) as RegionalProduct[];
                }
              }
              break;
            }

            case ProductTypeFilter.SHAPE: {
              const shapesResponse = await this.shapeService.findAll({
                page: 1,
                limit: 1000,
                regionId,
                sortBy: ShapeSortBy.CREATED_AT,
                order: 'desc',
              });
              if (shapesResponse.data) {
                const shapeData = shapesResponse.data as unknown as {
                  items: Record<string, unknown>[];
                };
                if ('items' in shapeData) {
                  const shapeItems = shapeData.items;
                  products = shapeItems.map((shape) => ({
                    ...shape,
                    type: ProductTypeFilter.SHAPE,
                  })) as RegionalProduct[];
                }
              }
              break;
            }

            case ProductTypeFilter.DECORATION: {
              const decorationsResponse = await this.decorationService.findAll({
                page: 1,
                limit: 1000,
                regionId,
                sortBy: DecorationSortBy.CREATED_AT,
                order: 'desc',
              });
              if (decorationsResponse.data) {
                const decorationData = decorationsResponse.data as unknown as {
                  items: Record<string, unknown>[];
                };
                if ('items' in decorationData) {
                  const decorationItems = decorationData.items;
                  products = decorationItems.map((decoration) => ({
                    ...decoration,
                    type: ProductTypeFilter.DECORATION,
                  })) as RegionalProduct[];
                }
              }
              break;
            }

            case ProductTypeFilter.PREDESIGNED_CAKE: {
              const predesignedResponse = await this.predesignedCakesService.findAll({
                page: 1,
                limit: 1000,
                regionId,
              });
              if (predesignedResponse.data && 'items' in predesignedResponse.data) {
                const predesignedItems = (
                  predesignedResponse.data as {
                    items: Record<string, unknown>[];
                  }
                ).items;
                products = predesignedItems.map((cake) => ({
                  ...cake,
                  type: ProductTypeFilter.PREDESIGNED_CAKE,
                })) as RegionalProduct[];
              }
              break;
            }
          }

          allProducts.push(...products);
        } catch (err) {
          this.logger.warn(`Failed to fetch products for type ${type}:`, err);
        }
      }

      // Fetch regional prices for products that have pricing
      const enrichedProducts = await Promise.all(
        allProducts.map(async (product) => {
          const productType = product.type as ProductTypeFilter;
          const productId = product.id as string;

          try {
            let pricing: typeof regionItemPrices.$inferSelect | undefined;

            // Handle each product type's regional pricing query
            switch (productType) {
              case ProductTypeFilter.ADDON:
                [pricing] = await db
                  .select()
                  .from(regionItemPrices)
                  .where(
                    and(
                      eq(regionItemPrices.regionId, regionId),
                      eq(regionItemPrices.addonId, productId),
                    ),
                  )
                  .limit(1);
                break;
              case ProductTypeFilter.FLAVOR:
                [pricing] = await db
                  .select()
                  .from(regionItemPrices)
                  .where(
                    and(
                      eq(regionItemPrices.regionId, regionId),
                      eq(regionItemPrices.flavorId, productId),
                    ),
                  )
                  .limit(1);
                break;
              case ProductTypeFilter.SHAPE:
                [pricing] = await db
                  .select()
                  .from(regionItemPrices)
                  .where(
                    and(
                      eq(regionItemPrices.regionId, regionId),
                      eq(regionItemPrices.shapeId, productId),
                    ),
                  )
                  .limit(1);
                break;
              case ProductTypeFilter.DECORATION:
                [pricing] = await db
                  .select()
                  .from(regionItemPrices)
                  .where(
                    and(
                      eq(regionItemPrices.regionId, regionId),
                      eq(regionItemPrices.decorationId, productId),
                    ),
                  )
                  .limit(1);
                break;
            }

            if (pricing) {
              this.logger.debug(
                `Found regional pricing for ${productType} ${productId}: price=${pricing.price}`,
              );
              return {
                ...product,
                price: pricing.price,
                sizesPrices: pricing.sizesPrices,
              };
            }
          } catch (err) {
            this.logger.warn(
              `Failed to fetch regional pricing for ${productType} ${productId}:`,
              err,
            );
          }

          return product;
        }),
      );

      enrichedProducts.sort(
        (a, b) =>
          new Date(b.createdAt as string | number).getTime() -
          new Date(a.createdAt as string | number).getTime(),
      );

      const totalCount = enrichedProducts.length;
      const offset = (page - 1) * limit;
      const paginatedProducts = enrichedProducts.slice(offset, offset + limit);

      return successResponse(
        {
          items: paginatedProducts,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
        'Regional products retrieved successfully',
        HttpStatus.OK,
      );
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error fetching regional products for region ${regionId}:`, err);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve regional products',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async removeRegionalItemPrice(
    regionId: string,
    productType: string,
    productId: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    // Verify region exists
    const [region] = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);

    if (!region) {
      this.logger.warn(`Regional item price deletion failed: Region not found - ${regionId}`);
      throw new NotFoundException(
        errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Map product type to the corresponding ID field in regionItemPrices table
    const productFieldMap: Record<string, keyof typeof regionItemPrices.$inferSelect> = {
      'featured-cakes': 'featuredCakeId',
      addons: 'addonId',
      sweets: 'sweetId',
      flavors: 'flavorId',
      shapes: 'shapeId',
      decorations: 'decorationId',
      'predesigned-cakes': 'predesignedCakeId',
    };

    const productField = productFieldMap[productType];

    if (!productField) {
      this.logger.warn(`Invalid product type: ${productType}`);
      throw new NotFoundException(
        errorResponse('Invalid product type', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Find and delete the regional item price based on region and product
    const [regionalItemPrice] = await db
      .select()
      .from(regionItemPrices)
      .where(
        and(eq(regionItemPrices.regionId, regionId), eq(regionItemPrices[productField], productId)),
      )
      .limit(1);

    if (!regionalItemPrice) {
      this.logger.warn(
        `Regional item price deletion failed: Product ${productType} (${productId}) not found in region ${regionId}`,
      );
      throw new NotFoundException(
        errorResponse(
          'Product pricing not found for this region',
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
      );
    }

    try {
      await db.delete(regionItemPrices).where(eq(regionItemPrices.id, regionalItemPrice.id));

      this.logger.log(
        `Regional item price deleted: ${productType} (${productId}) from region: ${regionId}`,
      );

      return successResponse(
        { message: 'Regional item price removed successfully' },
        'Regional item price removed',
        HttpStatus.OK,
      );
    } catch (err) {
      this.logger.error(
        `Regional item price deletion error for product ${productType} (${productId}):`,
        err,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete regional item price',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
