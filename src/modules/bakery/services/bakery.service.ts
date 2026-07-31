import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { bakeries, regions, orders, bakeryItemStores, regionItemPrices } from '@/db/schema';
import { eq, desc, asc, sql, getTableColumns, and, inArray, arrayContains } from 'drizzle-orm';
import {
  CreateBakeryDto,
  UpdateBakeryDto,
  BakeryResponse,
  PaginationDto,
  SortDto,
  GetBiggestCapacityBakeryDto,
} from '../dto';
import { errorResponse, handleErrorsAndThrow, successResponse, SuccessResponse } from '@/utils';
import { TranslationService } from '@/common/translation/translation.service';
import { BakeryItemStoreService, bakeryCarriesStock } from './bakery-item-store.service';

@Injectable()
export class BakeryService {
  private readonly logger = new Logger(BakeryService.name);

  constructor(
    private readonly translationService: TranslationService,
    private readonly bakeryItemStoreService: BakeryItemStoreService,
  ) {}

  async create(createBakeryDto: CreateBakeryDto): Promise<SuccessResponse<BakeryResponse>> {
    const { name, locationDescription, regionId, capacity, bakeryTypes } = createBakeryDto;

    // Validate region exists
    const existingRegion = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);

    if (existingRegion.length === 0) {
      this.logger.warn(`Bakery creation failed: Invalid region ID`);
      throw new BadRequestException(
        errorResponse(
          'routes.regions.not_found_with_id',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { regionId },
        ),
      );
    }

    const nameObject = await this.translationService.getTranslationObject(name);
    const locationDescriptionObject =
      await this.translationService.getTranslationObject(locationDescription);

    try {
      const [newBakery] = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(bakeries)
          .values({
            name: nameObject,
            locationDescription: locationDescriptionObject,
            regionId,
            capacity,
            bakeryTypes: bakeryTypes as ('big_cakes' | 'small_cakes' | 'others')[],
          })
          .returning({
            ...getTableColumns(bakeries),
            name: this.translationService.getLocalized(bakeries.name, 'name'),
            locationDescription: this.translationService.getLocalized(
              bakeries.locationDescription,
              'location_description',
            ),
          });

        const [created] = inserted;

        // A new bakery starts carrying everything its region already sells,
        // at zero stock, so it shows up in the region's catalogue right away
        // instead of silently returning an empty item list.
        if (bakeryCarriesStock(created.bakeryTypes)) {
          await this.bakeryItemStoreService.createStoresForBakery(created.id, regionId, tx);
        }

        return inserted;
      });

      this.logger.log(`Bakery created: ${newBakery.id} (${name})`);

      return successResponse(
        this.formatBakeryResponse(newBakery),
        'routes.bakery.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bakery creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(pagination: PaginationDto, sort: SortDto) {
    const { page = 1, limit = 10 } = pagination;

    try {
      const offset = (page - 1) * limit;

      // Get total count (excluding soft-deleted bakeries)
      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(bakeries)
        .where(eq(bakeries.isDeleted, false));
      const total = typeof count === 'string' ? parseInt(count, 10) : count;

      const sortOrder = sort.order === 'desc' ? desc : asc;

      const allBakeries = await db
        .select({
          ...getTableColumns(bakeries),
          name: this.translationService.getLocalized(bakeries.name, 'name'),
          locationDescription: this.translationService.getLocalized(
            bakeries.locationDescription,
            'location_description',
          ),
        })
        .from(bakeries)
        .where(eq(bakeries.isDeleted, false))
        .orderBy(sort.sort === 'alpha' ? sortOrder(bakeries.name) : sortOrder(bakeries.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved bakeries: page ${page}, total ${total}`);

      const formattedBakeries = allBakeries.map((bakery) => this.formatBakeryResponse(bakery));

      this.logger.debug(`Retrieved ${allBakeries.length} bakeries`);

      return successResponse(
        {
          items: formattedBakeries,
          pagination: {
            total,
            totalPages,
            page,
            limit: limit,
          },
        },
        'routes.bakery.list_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve bakeries: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<BakeryResponse>> {
    const [bakery] = await db
      .select({
        ...getTableColumns(bakeries),
        name: this.translationService.getLocalized(bakeries.name, 'name'),
        locationDescription: this.translationService.getLocalized(
          bakeries.locationDescription,
          'location_description',
        ),
      })
      .from(bakeries)
      .where(and(eq(bakeries.id, id), eq(bakeries.isDeleted, false)))
      .limit(1);

    if (!bakery) {
      this.logger.warn(`Bakery not found: ${id}`);
      throw new NotFoundException(
        errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Bakery retrieved: ${id}`);

    return successResponse(
      this.formatBakeryResponse(bakery),
      'routes.bakery.retrieved',
      HttpStatus.OK,
    );
  }

  async update(
    id: string,
    updateBakeryDto: UpdateBakeryDto,
  ): Promise<SuccessResponse<BakeryResponse>> {
    const { name, locationDescription, regionId, capacity, bakeryTypes } = updateBakeryDto;

    const [existingBakery] = await db.select().from(bakeries).where(eq(bakeries.id, id)).limit(1);

    if (!existingBakery) {
      this.logger.warn(`Bakery update failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Validate region if provided
    if (regionId) {
      const existingRegion = await db
        .select()
        .from(regions)
        .where(eq(regions.id, regionId))
        .limit(1);

      if (existingRegion.length === 0) {
        this.logger.warn(`Bakery update failed: Invalid region ID`);
        throw new BadRequestException(
          errorResponse('routes.regions.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }
    }

    try {
      const updateData: Record<string, any> = {};

      if (name !== undefined) {
        updateData.name = await this.translationService.getTranslationObject(name);
      }
      if (locationDescription !== undefined) {
        updateData.locationDescription =
          await this.translationService.getTranslationObject(locationDescription);
      }
      if (regionId !== undefined) updateData.regionId = regionId;
      if (capacity !== undefined) updateData.capacity = capacity;
      if (bakeryTypes !== undefined)
        updateData.bakeryTypes = bakeryTypes as ('large_cakes' | 'small_cakes' | 'others')[];
      updateData.updatedAt = new Date();

      // A region change re-points stock at the new region's prices, so both
      // writes share a transaction — a moved bakery must never be left holding
      // stock priced in the region it came from.
      const isMovingRegion = regionId !== undefined && regionId !== existingBakery.regionId;

      const [updatedBakery] = await db.transaction(async (tx) => {
        const updated = await tx
          .update(bakeries)
          .set(updateData)
          .where(eq(bakeries.id, id))
          .returning({
            ...getTableColumns(bakeries),
            name: this.translationService.getLocalized(bakeries.name, 'name'),
            locationDescription: this.translationService.getLocalized(
              bakeries.locationDescription,
              'location_description',
            ),
          });

        if (isMovingRegion) {
          await this.migrateStockToRegion(tx, id, regionId);
        }

        return updated;
      });

      this.logger.log(`Bakery updated: ${id}`);

      return successResponse(
        this.formatBakeryResponse(updatedBakery),
        'routes.bakery.updated',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bakery update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    const [existingBakery] = await db
      .select()
      .from(bakeries)
      .where(and(eq(bakeries.id, id), eq(bakeries.isDeleted, false)))
      .limit(1);

    if (!existingBakery) {
      this.logger.warn(`Bakery deletion failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // A bakery can't be deleted while it still owns in-flight orders — anything
    // pending / confirmed / preparing must be reassigned or completed first.
    const [{ count }] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.bakeryId, id),
          inArray(orders.orderStatus, [
            'pending',
            'confirmed',
            'preparing',
          ] as (typeof orders.orderStatus.enumValues)[number][]),
        ),
      );
    const activeOrders = typeof count === 'string' ? parseInt(count, 10) : count;

    if (activeOrders > 0) {
      this.logger.warn(`Bakery deletion blocked: ${id} still has ${activeOrders} active order(s)`);
      throw new BadRequestException(
        errorResponse(
          'routes.bakery.has_active_orders',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          undefined,
          { count: activeOrders },
        ),
      );
    }

    try {
      await db
        .update(bakeries)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(bakeries.id, id));

      this.logger.log(`Bakery soft-deleted: ${id}`);

      return successResponse(
        { message: 'routes.bakery.deleted' },
        'routes.bakery.deleted',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Bakery deletion error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getBiggestCapacityBakery(
    regionId: string,
    dto: GetBiggestCapacityBakeryDto,
  ): Promise<SuccessResponse<BakeryResponse>> {
    const { cartType } = dto;

    try {
      const allBakeries = await db
        .select({
          ...getTableColumns(bakeries),
          name: this.translationService.getLocalized(bakeries.name, 'name'),
          locationDescription: this.translationService.getLocalized(
            bakeries.locationDescription,
            'location_description',
          ),
        })
        .from(bakeries)
        .where(
          and(
            eq(bakeries.isDeleted, false),
            eq(bakeries.regionId, regionId),
            arrayContains(bakeries.bakeryTypes, [cartType]),
          ),
        );

      if (!allBakeries.length || allBakeries.length === 0) {
        this.logger.warn(`Bakery not found: ${regionId}`);
        throw new NotFoundException(
          errorResponse(
            'routes.bakery.no_matching_bakery',
            HttpStatus.NOT_FOUND,
            'NotFoundException',
          ),
        );
      }

      const biggestCapacityBakery = allBakeries.reduce((prev, curr) => {
        return prev.capacity > curr.capacity ? prev : curr;
      });

      this.logger.debug(`Bakery retrieved: ${regionId}`);

      return successResponse(
        this.formatBakeryResponse(biggestCapacityBakery),
        'routes.bakery.retrieved_biggest_capacity_bakery',
        HttpStatus.OK,
      );
    } catch (error) {
      handleErrorsAndThrow(
        error,
        'routes.bakery.failed_retrieve_biggest_capacity_bakery',
        this.logger,
      );
    }
  }

  /**
   * Identifies which product a region price refers to. Stock is only ever kept
   * for addons, sweets and featured cakes, so those are the only keys that can
   * carry across a region move.
   */
  private stockableProductKey(price: {
    addonId: string | null;
    sweetId: string | null;
    featuredCakeId: string | null;
  }): string | null {
    if (price.addonId) return `addon:${price.addonId}`;
    if (price.sweetId) return `sweet:${price.sweetId}`;
    if (price.featuredCakeId) return `featured_cake:${price.featuredCakeId}`;
    return null;
  }

  /**
   * Re-points a bakery's stock at its new region.
   *
   * Stock rows reference `regionItemPriceId`, and prices belong to a region, so
   * a region change would otherwise leave every row pointing at the region the
   * bakery just left. Rows whose product is also priced in the new region are
   * remapped and keep their quantities; rows with no counterpart are dropped;
   * anything else priced in the new region is seeded at zero stock.
   */
  private async migrateStockToRegion(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    bakeryId: string,
    newRegionId: string,
  ): Promise<void> {
    const existingStock = await tx
      .select({
        id: bakeryItemStores.id,
        stock: bakeryItemStores.stock,
        optionsStock: bakeryItemStores.optionsStock,
        addonId: regionItemPrices.addonId,
        sweetId: regionItemPrices.sweetId,
        featuredCakeId: regionItemPrices.featuredCakeId,
      })
      .from(bakeryItemStores)
      .innerJoin(regionItemPrices, eq(bakeryItemStores.regionItemPriceId, regionItemPrices.id))
      .where(eq(bakeryItemStores.bakeryId, bakeryId));

    // Every stockable price in the destination region, keyed by product
    const newRegionPrices = await tx
      .select({
        id: regionItemPrices.id,
        addonId: regionItemPrices.addonId,
        sweetId: regionItemPrices.sweetId,
        featuredCakeId: regionItemPrices.featuredCakeId,
      })
      .from(regionItemPrices)
      .where(eq(regionItemPrices.regionId, newRegionId));

    const pricesByProduct = new Map<string, string>();
    for (const price of newRegionPrices) {
      const key = this.stockableProductKey(price);
      // First price wins if a product is somehow priced twice in a region
      if (key && !pricesByProduct.has(key)) pricesByProduct.set(key, price.id);
    }

    // Carry quantities across for products the new region also sells
    const carriedKeys = new Set<string>();
    for (const row of existingStock) {
      const key = this.stockableProductKey(row);
      if (!key) continue;

      const newPriceId = pricesByProduct.get(key);
      if (!newPriceId) continue;

      await tx
        .update(bakeryItemStores)
        .set({ regionItemPriceId: newPriceId, updatedAt: new Date() })
        .where(eq(bakeryItemStores.id, row.id));

      carriedKeys.add(key);
    }

    // Drop rows with no counterpart — they point at the old region's prices
    const orphanIds = existingStock
      .filter((row) => {
        const key = this.stockableProductKey(row);
        return !key || !pricesByProduct.has(key);
      })
      .map((row) => row.id);

    if (orphanIds.length > 0) {
      await tx.delete(bakeryItemStores).where(inArray(bakeryItemStores.id, orphanIds));
    }

    // Seed everything else the new region sells at zero stock
    const toSeed = [...pricesByProduct.entries()]
      .filter(([key]) => !carriedKeys.has(key))
      .map(([, priceId]) => ({ bakeryId, regionItemPriceId: priceId, stock: 0 }));

    if (toSeed.length > 0) {
      await tx.insert(bakeryItemStores).values(toSeed);
    }

    this.logger.log(
      `Bakery ${bakeryId} moved to region ${newRegionId}: ` +
        `${carriedKeys.size} carried, ${orphanIds.length} dropped, ${toSeed.length} seeded`,
    );
  }

  private formatBakeryResponse(bakery: {
    id: string;
    regionId: string;
    name: string;
    locationDescription: string;
    capacity: number;
    bakeryTypes: Array<string>;
    averageRating?: string | null;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
  }): BakeryResponse {
    return {
      id: bakery.id,
      name: bakery.name,
      locationDescription: bakery.locationDescription,
      capacity: bakery.capacity,
      regionId: bakery.regionId,
      types: bakery.bakeryTypes,
      averageRating: bakery.averageRating ? parseFloat(bakery.averageRating) : undefined,
      totalReviews: bakery.totalReviews,
      createdAt: bakery.createdAt,
      updatedAt: bakery.updatedAt,
    };
  }
}
