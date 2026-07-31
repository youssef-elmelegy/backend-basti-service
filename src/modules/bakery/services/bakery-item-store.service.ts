import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import {
  bakeryItemStores,
  bakeries,
  regionItemPrices,
  addons,
  addonOptions,
  sweets,
  featuredCakes,
} from '@/db/schema';
import { and, eq, isNotNull, or } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { OptionsStockDto } from '../dto';
import { TranslationService } from '@/common/translation/translation.service';

export interface BakeryItemStoreResponse {
  id: string;
  bakeryId: string;
  regionItemPriceId: string;
  stock: number;
  optionsStock: OptionsStockDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateStockDto {
  stock: number;
  optionsStock?: OptionsStockDto[];
}

// Accepts either the plain db handle or a transaction, so callers can bundle
// stock seeding with another write (e.g. bakery creation) atomically.
type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Only "others" bakeries hold stock. Big/small cake bakeries produce custom
 * cakes to order and carry no sweets, featured cakes or addons. `big_cakes`
 * and `large_cakes` are the same type stored under two spellings, but neither
 * carries stock, so both simply fail this check.
 */
export function bakeryCarriesStock(bakeryTypes: string[] | null | undefined): boolean {
  return (bakeryTypes ?? []).includes('others');
}

/**
 * A region item price points at exactly one of seven item kinds, but only
 * addons, sweets and featured cakes are things a bakery physically stocks.
 * The rest (decorations, flavors, shapes, predesigned cakes) are customizer
 * components priced per region and built to order, so they must never get a
 * `bakery_item_stores` row — one would render as a product-less "Unknown
 * Item" card, since `getBakeryItemStores` can only resolve the three
 * stockable kinds.
 */
const stockableItemPrice = () =>
  or(
    isNotNull(regionItemPrices.addonId),
    isNotNull(regionItemPrices.sweetId),
    isNotNull(regionItemPrices.featuredCakeId),
  );

@Injectable()
export class BakeryItemStoreService {
  private readonly logger = new Logger(BakeryItemStoreService.name);

  constructor(private readonly translationService: TranslationService) {}

  /**
   * Create bakery item stores for all bakeries in a region when a region item price is created
   */
  async createStoresForRegionItemPrice(regionItemPriceId: string, regionId: string) {
    try {
      // Customizer components (decorations/flavors/shapes/predesigned cakes)
      // are priced per region but never stocked, so they get no store rows.
      const [stockablePrice] = await db
        .select({ id: regionItemPrices.id })
        .from(regionItemPrices)
        .where(and(eq(regionItemPrices.id, regionItemPriceId), stockableItemPrice()))
        .limit(1);

      if (!stockablePrice) {
        this.logger.log(`Region item price ${regionItemPriceId} is not stockable; skipping stores`);
        return [];
      }

      // Get all active (non-deleted) bakeries in the region
      const bakeriesInRegion = await db
        .select()
        .from(bakeries)
        .where(and(eq(bakeries.regionId, regionId), eq(bakeries.isDeleted, false)));

      if (bakeriesInRegion.length === 0) {
        this.logger.log(`No bakeries found in region ${regionId}`);
        return [];
      }

      // Create store records for each bakery
      const storeRecords = bakeriesInRegion.map((bakery) => ({
        bakeryId: bakery.id,
        regionItemPriceId: regionItemPriceId,
        stock: 0,
        optionsStock: [],
      }));

      const createdStores = await db.insert(bakeryItemStores).values(storeRecords).returning();

      this.logger.log(
        `Created ${createdStores.length} bakery item stores for region item price ${regionItemPriceId}`,
      );
      return createdStores;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create bakery item stores: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_create_item_stores',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Create bakery item stores for a new bakery, one per region item price
   * already priced in its region. Mirrors createStoresForRegionItemPrice
   * (same seeding at zero stock), just keyed the other way around: one
   * bakery against every existing price instead of one price against every
   * existing bakery.
   */
  async createStoresForBakery(bakeryId: string, regionId: string, dbClient: DbClient = db) {
    try {
      const pricesInRegion = await dbClient
        .select({ id: regionItemPrices.id })
        .from(regionItemPrices)
        .where(and(eq(regionItemPrices.regionId, regionId), stockableItemPrice()));

      if (pricesInRegion.length === 0) {
        this.logger.log(`No stockable region item prices found in region ${regionId}`);
        return [];
      }

      const storeRecords = pricesInRegion.map((price) => ({
        bakeryId,
        regionItemPriceId: price.id,
        stock: 0,
        optionsStock: [],
      }));

      const createdStores = await dbClient
        .insert(bakeryItemStores)
        .values(storeRecords)
        .returning();

      this.logger.log(
        `Created ${createdStores.length} bakery item stores for bakery ${bakeryId} in region ${regionId}`,
      );
      return createdStores;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create bakery item stores for bakery: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_create_item_stores',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Delete bakery item stores for a region item price
   */
  async deleteStoresForRegionItemPrice(regionItemPriceId: string) {
    try {
      const deleted = await db
        .delete(bakeryItemStores)
        .where(eq(bakeryItemStores.regionItemPriceId, regionItemPriceId))
        .returning();

      this.logger.log(
        `Deleted ${deleted.length} bakery item stores for region item price ${regionItemPriceId}`,
      );
      return deleted;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete bakery item stores: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_delete_item_stores',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Get all item stores for a bakery with product details
   */
  async getBakeryItemStores(bakeryId: string): Promise<SuccessResponse<any[]>> {
    try {
      // Validate bakery exists (and read its types, which gate addon stock)
      const [bakeryExists] = await db
        .select({ id: bakeries.id, bakeryTypes: bakeries.bakeryTypes })
        .from(bakeries)
        .where(eq(bakeries.id, bakeryId))
        .limit(1);

      if (!bakeryExists) {
        throw new NotFoundException(
          errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      if (!bakeryCarriesStock(bakeryExists.bakeryTypes)) {
        this.logger.debug(`Bakery ${bakeryId} is not a stock-carrying type; returning no items`);
        return successResponse([], 'routes.bakery.item_stores_retrieved', HttpStatus.OK);
      }

      // Get stores with region item price details
      const stores = await db
        .select({
          id: bakeryItemStores.id,
          bakeryId: bakeryItemStores.bakeryId,
          regionItemPriceId: bakeryItemStores.regionItemPriceId,
          stock: bakeryItemStores.stock,
          optionsStock: bakeryItemStores.optionsStock,
          createdAt: bakeryItemStores.createdAt,
          updatedAt: bakeryItemStores.updatedAt,
          price: regionItemPrices.price,
          sizesPrices: regionItemPrices.sizesPrices,
          addonId: regionItemPrices.addonId,
          featuredCakeId: regionItemPrices.featuredCakeId,
          sweetId: regionItemPrices.sweetId,
          decorationId: regionItemPrices.decorationId,
          flavorId: regionItemPrices.flavorId,
          shapeId: regionItemPrices.shapeId,
          predesignedCakeId: regionItemPrices.predesignedCakeId,
        })
        .from(bakeryItemStores)
        .innerJoin(regionItemPrices, eq(bakeryItemStores.regionItemPriceId, regionItemPrices.id))
        .where(eq(bakeryItemStores.bakeryId, bakeryId));

      // Enrich stores with product data
      const enrichedStores = await Promise.all(
        stores.map(async (store) => {
          let product: any = null;
          let finalOptionsStock = store.optionsStock || [];

          // Fetch product based on type
          if (store.addonId) {
            const [addonData] = await db
              .select({
                id: addons.id,
                name: this.translationService.getLocalized(addons.name, 'name'),
                description: this.translationService.getLocalized(
                  addons.description,
                  'description',
                ),
                images: addons.images,
              })
              .from(addons)
              .where(eq(addons.id, store.addonId))
              .limit(1);
            product = addonData ? { ...addonData, type: 'addon' } : null;

            // Fetch all addon options with their details
            const allOptions = await db
              .select({
                id: addonOptions.id,
                label: addonOptions.label,
                value: addonOptions.value,
                type: addonOptions.type,
                imageUrl: addonOptions.imageUrl,
              })
              .from(addonOptions)
              .where(eq(addonOptions.addonId, store.addonId));

            // Merge options with stored stock or create placeholders with 0 stock
            if (allOptions.length > 0) {
              finalOptionsStock = allOptions.map((option) => {
                const storedStock = (store.optionsStock || []).find(
                  (os) => os.optionId === option.id,
                );
                return {
                  optionId: option.id,
                  label: option.label,
                  value: option.value,
                  type: option.type,
                  imageUrl: option.imageUrl,
                  stock: storedStock?.stock ?? 0,
                };
              });
            }
          } else if (store.sweetId) {
            const [sweetData] = await db
              .select({
                id: sweets.id,
                name: sweets.name,
                description: sweets.description,
                images: sweets.images,
              })
              .from(sweets)
              .where(eq(sweets.id, store.sweetId))
              .limit(1);
            product = sweetData ? { ...sweetData, type: 'sweet' } : null;
          } else if (store.featuredCakeId) {
            const [cakeData] = await db
              .select({
                id: featuredCakes.id,
                name: featuredCakes.name,
                description: featuredCakes.description,
                images: featuredCakes.images,
              })
              .from(featuredCakes)
              .where(eq(featuredCakes.id, store.featuredCakeId))
              .limit(1);
            product = cakeData ? { ...cakeData, type: 'featured_cake' } : null;
          }

          return {
            ...store,
            optionsStock: finalOptionsStock,
            product,
          };
        }),
      );

      // Rows whose product could not be resolved are not renderable — they are
      // either legacy stores seeded against a non-stockable price, or an item
      // deleted out from under the store. Drop them rather than let the
      // dashboard show a nameless card.
      const renderableStores = enrichedStores.filter((store) => store.product !== null);
      const skipped = enrichedStores.length - renderableStores.length;
      if (skipped > 0) {
        this.logger.warn(
          `Skipped ${skipped} item store(s) with unresolvable products for bakery ${bakeryId}`,
        );
      }

      this.logger.debug(`Retrieved ${renderableStores.length} item stores for bakery ${bakeryId}`);

      return successResponse(
        renderableStores,
        'routes.bakery.item_stores_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get bakery item stores: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_retrieve_item_stores',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Update stock for a specific item store
   */
  async updateStock(
    storeId: string,
    updateStockDto: UpdateStockDto,
  ): Promise<SuccessResponse<BakeryItemStoreResponse>> {
    try {
      const { stock, optionsStock } = updateStockDto;

      // Validate store exists
      const [storeExists] = await db
        .select()
        .from(bakeryItemStores)
        .where(eq(bakeryItemStores.id, storeId))
        .limit(1);

      if (!storeExists) {
        throw new NotFoundException(
          errorResponse(
            'routes.bakery.item_store_not_found',
            HttpStatus.NOT_FOUND,
            'NotFoundException',
          ),
        );
      }

      // Validate stock is non-negative
      if (stock < 0) {
        throw new BadRequestException(
          errorResponse(
            'routes.bakery.stock_negative',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      // Validate each stock option is non-negative
      if (optionsStock) {
        for (const option of optionsStock) {
          if (option.stock < 0) {
            throw new BadRequestException(
              errorResponse(
                'routes.bakery.option_stock_negative',
                HttpStatus.BAD_REQUEST,
                'BadRequestException',
              ),
            );
          }
        }
      }

      let reCalculatedStock = stock;

      if (optionsStock && optionsStock.length > 0) {
        reCalculatedStock = optionsStock.reduce((acc, option) => acc + option.stock, 0);
      }

      const [updated] = await db
        .update(bakeryItemStores)
        .set({
          stock: reCalculatedStock,
          optionsStock: optionsStock || [],
          updatedAt: new Date(),
        })
        .where(eq(bakeryItemStores.id, storeId))
        .returning();

      this.logger.log(`Stock updated for item store ${storeId}: ${stock}`);

      return successResponse(
        {
          id: updated.id,
          bakeryId: updated.bakeryId,
          regionItemPriceId: updated.regionItemPriceId,
          stock: updated.stock,
          optionsStock: updated.optionsStock || [],
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
        'routes.bakery.stock_updated',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update stock: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_update_stock',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
