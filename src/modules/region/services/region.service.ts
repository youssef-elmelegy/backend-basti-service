import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { db } from '@/db';
import { regions, regionItemPrices, admins, bakeries, coupons } from '@/db/schema';
import { eq, asc, desc, SQL, and, gt, lt, gte, lte, sql, getTableColumns } from 'drizzle-orm';
import {
  CreateRegionDto,
  UpdateRegionDto,
  ChangeRegionOrderDto,
  RegionResponse,
  GetRegionsQueryDto,
  GetRegionalProductsQueryDto,
  ProductTypeFilter,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse, getErrorMessage } from '@/utils';
import { FeaturedCakeService } from '@/modules/featured-cake/services/featured-cake.service';
import { AddonService } from '@/modules/addon/services/addon.service';
import { SweetService } from '@/modules/sweet/services/sweet.service';
import { FlavorService } from '@/modules/custom-cakes/services/flavor.service';
import { ShapeService } from '@/modules/custom-cakes/services/shape.service';
import { DecorationService } from '@/modules/custom-cakes/services/decoration.service';
import { PredesignedCakesService } from '@/modules/custom-cakes/services/predesigned-cakes.service';
import { SweetSortBy } from '@/modules/sweet/dto';
import { FlavorSortBy } from '@/modules/custom-cakes/dto';
import { ShapeSortBy, ShapeDataDto } from '@/modules/custom-cakes/dto';
import { DecorationSortBy } from '@/modules/custom-cakes/dto';
import { TranslationService } from '@/common';

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
    private readonly translationService: TranslationService,
  ) {}

  async create(createRegionDto: CreateRegionDto): Promise<SuccessResponse<RegionResponse>> {
    const { name, image, isAvailable } = createRegionDto;

    const existingRegion = await db
      .select()
      .from(regions)
      .where(eq(this.translationService.getLocalized(regions.name, null, 'en'), name))
      .limit(1);

    if (existingRegion.length > 0) {
      this.logger.warn(`Region creation failed: Name already exists - ${name}`);
      throw new ConflictException(
        errorResponse('routes.regions.name_exists', HttpStatus.CONFLICT, 'ConflictException'),
      );
    }

    try {
      // Get the max order to calculate the next order
      const [maxOrderResult] = await db
        .select({
          maxOrder: sql<number | null>`max("order")`,
        })
        .from(regions);

      const nextOrder = (maxOrderResult?.maxOrder || 0) + 1;

      const nameObject = await this.translationService.getTranslationObject(name);

      const [newRegion] = await db
        .insert(regions)
        .values({
          name: nameObject,
          image,
          isAvailable,
          order: nextOrder,
        })
        .returning({
          ...getTableColumns(regions),
          name: this.translationService.getLocalized(regions.name, 'name'),
        });

      this.logger.log(`Region created: ${newRegion.id} (${name}) with order: ${nextOrder}`);

      return successResponse(
        {
          id: newRegion.id,
          name: newRegion.name,
          image: newRegion.image || '',
          isAvailable: newRegion.isAvailable,
          order: newRegion.order,
          createdAt: newRegion.createdAt,
          updatedAt: newRegion.updatedAt,
        },
        'routes.regions.created',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Region creation error for ${name}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.regions.failed_create',
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

      // Always order by region order (primary or secondary sort)
      orderByConditions.push(asc(regions.order));

      const filter: SQL[] = [];
      if (query?.isAvailable !== undefined && query.isAvailable !== null) {
        filter.push(eq(regions.isAvailable, query.isAvailable));
      }

      const allRegions =
        filter.length > 0
          ? await db
              .select({
                ...getTableColumns(regions),
                name: this.translationService.getLocalized(regions.name, 'name'),
              })
              .from(regions)
              .where(and(...filter))
              .orderBy(...orderByConditions)
          : await db
              .select({
                ...getTableColumns(regions),
                name: this.translationService.getLocalized(regions.name, 'name'),
              })
              .from(regions)
              .orderBy(...orderByConditions);

      // Ensure deterministic ordering by `order` field as a safety-net
      // in case the DB ordering isn't applied for any reason.
      allRegions.sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : Number(a.order) || 0;
        const bo = typeof b.order === 'number' ? b.order : Number(b.order) || 0;
        return ao - bo;
      });

      this.logger.debug(`Retrieved ${allRegions.length} regions`);

      return successResponse(
        allRegions.map((region) => ({
          id: region.id,
          name: region.name,
          image: region.image,
          isAvailable: region.isAvailable,
          order: region.order,
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
        })),
        'routes.regions.list_retrieved',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error('Failed to retrieve regions');
      throw new InternalServerErrorException(
        errorResponse(
          'routes.regions.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<RegionResponse>> {
    const [region] = await db
      .select({
        ...getTableColumns(regions),
        name: this.translationService.getLocalized(regions.name, 'name'),
      })
      .from(regions)
      .where(eq(regions.id, id))
      .limit(1);

    if (!region) {
      this.logger.warn(`Region not found: ${id}`);
      throw new NotFoundException(
        errorResponse('routes.regions.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Region retrieved: ${id}`);

    return successResponse(
      {
        id: region.id,
        name: region.name,
        image: region.image,
        isAvailable: region.isAvailable,
        order: region.order,
        createdAt: region.createdAt,
        updatedAt: region.updatedAt,
      },
      'routes.regions.retrieved',
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
        errorResponse('routes.regions.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (name) {
      const [duplicateRegion] = await db
        .select()
        .from(regions)
        .where(eq(this.translationService.getLocalized(regions.name, null, 'en'), name))
        .limit(1);

      if (duplicateRegion && duplicateRegion.id !== id) {
        this.logger.warn(`Region update failed: Name already exists - ${name}`);
        throw new ConflictException(
          errorResponse('routes.regions.name_exists', HttpStatus.CONFLICT, 'ConflictException'),
        );
      }
    }

    const updateData: Record<string, any> = {};

    if (name) {
      updateData.name = await this.translationService.getTranslationObject(name);
    }
    if (image) updateData.image = image;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        errorResponse(
          'routes.common.no_fields_to_update',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    updateData.updatedAt = new Date();

    try {
      const [updatedRegion] = await db
        .update(regions)
        .set(updateData)
        .where(eq(regions.id, id))
        .returning({
          ...getTableColumns(regions),
          name: this.translationService.getLocalized(regions.name, 'name'),
        });

      this.logger.log(`Region updated: ${id}`);

      return successResponse(
        {
          id: updatedRegion.id,
          name: updatedRegion.name,
          image: updatedRegion.image || '',
          isAvailable: updatedRegion.isAvailable,
          order: updatedRegion.order,
          createdAt: updatedRegion.createdAt,
          updatedAt: updatedRegion.updatedAt,
        },
        'routes.regions.updated',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Region update error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.regions.failed_update',
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
        errorResponse('routes.regions.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // admins, bakeries and coupons reference regions with ON DELETE NO ACTION, so
    // rows in any of them make the DELETE below fail at the DB level. Count them up
    // front and report *what* is blocking, so the dashboard can tell the user what
    // to reassign instead of surfacing an opaque 500.
    const blockers = await this.findDeletionBlockers(id);

    if (blockers.length > 0) {
      // Render each blocker in the caller's language ("2 admins" / "2 مشرفين") so the
      // interpolated summary is not a mix of translated text and English table names.
      const summary = blockers
        .map((b) =>
          this.translationService.staticTranslate(
            `messages.routes.regions.dependency_${b.table}`,
            undefined,
            {
              count: b.count,
            },
          ),
        )
        .join(', ');

      this.logger.warn(
        `Region deletion blocked for ${id}: still referenced by ` +
          blockers.map((b) => `${b.count} ${b.table}`).join(', '),
      );

      throw new ConflictException(
        errorResponse(
          'routes.regions.has_dependencies',
          HttpStatus.CONFLICT,
          'ConflictException',
          Object.fromEntries(blockers.map((b) => [b.table, b.count])),
          { summary },
        ),
      );
    }

    try {
      const deletedRegionOrder = existingRegion.order;

      // Delete the region
      await db.delete(regions).where(eq(regions.id, id));

      // Reorder all regions after the deleted one - decrease their order by 1
      await db
        .update(regions)
        .set({
          order: sql`"order" - 1`,
          updatedAt: new Date(),
        })
        .where(gt(regions.order, deletedRegionOrder));

      this.logger.log(
        `Region deleted: ${id} (was at order: ${deletedRegionOrder}), reordered subsequent regions`,
      );

      return successResponse(
        { message: 'routes.regions.deleted' },
        'routes.regions.deleted',
        HttpStatus.OK,
      );
    } catch (error) {
      // Bind and log the cause: without it a constraint violation surfaces as a
      // bare "failed_delete" with nothing to diagnose from.
      this.logger.error(
        `Region deletion error for ${id}: ${getErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.regions.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Counts the rows that hold a non-cascading foreign key to this region, i.e.
   * exactly what Postgres would reject the DELETE over. Returns one entry per
   * blocking table, so callers can report every blocker at once rather than
   * making the user discover them one failed delete at a time.
   *
   * region_item_prices is deliberately absent: it cascades, so it never blocks.
   */
  private async findDeletionBlockers(
    regionId: string,
  ): Promise<{ table: 'admins' | 'bakeries' | 'coupons'; count: number }[]> {
    const [adminCount, bakeryCount, couponCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(admins)
        .where(eq(admins.regionId, regionId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bakeries)
        .where(eq(bakeries.regionId, regionId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(coupons)
        .where(eq(coupons.regionId, regionId)),
    ]);

    return (
      [
        { table: 'admins' as const, count: adminCount[0]?.count ?? 0 },
        { table: 'bakeries' as const, count: bakeryCount[0]?.count ?? 0 },
        { table: 'coupons' as const, count: couponCount[0]?.count ?? 0 },
      ] satisfies { table: 'admins' | 'bakeries' | 'coupons'; count: number }[]
    ).filter((b) => b.count > 0);
  }

  async changeRegionOrder(
    id: string,
    changeOrderDto: ChangeRegionOrderDto,
  ): Promise<SuccessResponse<RegionResponse[]>> {
    const { order: newOrder } = changeOrderDto;

    // Get the region to update
    const [region] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);

    if (!region) {
      this.logger.warn(`Region order change failed: Region not found - ${id}`);
      throw new NotFoundException(
        errorResponse('routes.regions.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Get total count of regions to validate the new order
    const totalRegions = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(regions);

    const totalCount = Number(totalRegions[0]?.count) || 0;

    // Validate new order is within valid range
    if (newOrder < 1 || newOrder > totalCount) {
      this.logger.warn(
        `Region order change failed: Invalid order position - ${newOrder} (valid range: 1-${totalCount})`,
      );
      throw new BadRequestException(
        errorResponse(
          'routes.regions.invalid_order_position',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    try {
      const currentOrder = region.order;

      const now = new Date();

      if (currentOrder !== newOrder) {
        if (newOrder < currentOrder) {
          // Moving up: regions from newOrder to currentOrder-1 shift down by 1
          await db.transaction(async (tx) => {
            // Update regions that need to shift down (move them out of the way first with +100000)
            await tx
              .update(regions)
              .set({
                order: sql`${regions.order} + 100000`,
                updatedAt: now,
              })
              .where(and(gte(regions.order, newOrder), lt(regions.order, currentOrder)));

            // Now move them from temp positions to final positions (shifted down by 1)
            await tx
              .update(regions)
              .set({
                order: sql`${regions.order} - 100000 + 1`,
                updatedAt: now,
              })
              .where(
                and(
                  gte(regions.order, newOrder + 100000),
                  lt(regions.order, currentOrder + 100000),
                ),
              );

            // Move target region to newOrder
            await tx
              .update(regions)
              .set({
                order: newOrder,
                updatedAt: now,
              })
              .where(eq(regions.id, id));
          });
        } else {
          // Moving down: regions from currentOrder+1 to newOrder shift up by 1
          await db.transaction(async (tx) => {
            // Update regions that need to shift up (move them out of the way first with +100000)
            await tx
              .update(regions)
              .set({
                order: sql`${regions.order} + 100000`,
                updatedAt: now,
              })
              .where(and(gt(regions.order, currentOrder), lte(regions.order, newOrder)));

            // Now move them from temp positions to final positions (shifted up by 1)
            await tx
              .update(regions)
              .set({
                order: sql`${regions.order} - 100000 - 1`,
                updatedAt: now,
              })
              .where(
                and(
                  gt(regions.order, currentOrder + 100000),
                  lte(regions.order, newOrder + 100000),
                ),
              );

            // Move target region to newOrder
            await tx
              .update(regions)
              .set({
                order: newOrder,
                updatedAt: now,
              })
              .where(eq(regions.id, id));
          });
        }
        this.logger.log(`Region order changed: ${id} from order ${currentOrder} to ${newOrder}`);
      } else {
        this.logger.debug(`Region order unchanged: ${id} (order: ${currentOrder})`);
      }

      // Fetch all regions sorted by order
      const allRegions = await db
        .select({
          ...getTableColumns(regions),
          name: this.translationService.getLocalized(regions.name, 'name'),
        })
        .from(regions)
        .orderBy(asc(regions.order));

      return successResponse(
        allRegions.map((region) => ({
          id: region.id,
          name: region.name,
          image: region.image,
          isAvailable: region.isAvailable,
          order: region.order,
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
        })),
        'routes.regions.order_updated',
        HttpStatus.OK,
      );
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Region order change error for ${id}:`, err);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.regions.failed_change_order',
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
          errorResponse('routes.regions.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
                }));
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
                }));
              }
              break;
            }

            case ProductTypeFilter.SWEET: {
              const sweetsResponse = await this.sweetService.findAll({
                page: 1,
                limit: 1000,
                regionId,
                sortBy: SweetSortBy.CREATED_AT,
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
                  }));
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
                  }));
                }
              }
              break;
            }

            case ProductTypeFilter.SHAPE: {
              const shapesResponse = await this.shapeService.findAll({
                regionId,
                sortBy: ShapeSortBy.CREATED_AT,
                order: 'desc',
              });
              if (shapesResponse.data) {
                const data = shapesResponse.data;
                let shapeItems: ShapeDataDto[] = [];

                // Service might return an array directly
                if (Array.isArray(data)) {
                  const candidate = data;
                  shapeItems = candidate.filter(
                    (d): d is ShapeDataDto => typeof d === 'object' && d !== null && 'id' in d,
                  );
                } else if (typeof data === 'object' && data !== null) {
                  // Or a paginated object { items, pagination }
                  const itemsCandidate = (data as { items?: unknown }).items;
                  if (Array.isArray(itemsCandidate)) {
                    const candidate = itemsCandidate;
                    shapeItems = candidate.filter(
                      (d): d is ShapeDataDto => typeof d === 'object' && d !== null && 'id' in d,
                    );
                  }
                }

                if (shapeItems.length > 0) {
                  products = shapeItems.map((shape) => ({
                    ...shape,
                    type: ProductTypeFilter.SHAPE,
                  }));
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
                  }));
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
                }));
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
        'routes.regions.regional_products_retrieved',
        HttpStatus.OK,
      );
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error fetching regional products for region ${regionId}:`, err);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.regions.failed_retrieve',
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
        errorResponse('routes.regions.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
        errorResponse(
          'routes.regions.invalid_product_type',
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
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
          'routes.regions.product_pricing_not_found',
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
        { message: 'routes.regions.item_price_removed_success' },
        'routes.regions.item_price_removed',
        HttpStatus.OK,
      );
    } catch (err) {
      this.logger.error(
        `Regional item price deletion error for product ${productType} (${productId}):`,
        err,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.regions.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
