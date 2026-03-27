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
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { OptionsStockDto } from '../dto';

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

@Injectable()
export class BakeryItemStoreService {
  private readonly logger = new Logger(BakeryItemStoreService.name);

  /**
   * Create bakery item stores for all bakeries in a region when a region item price is created
   */
  async createStoresForRegionItemPrice(regionItemPriceId: string, regionId: string) {
    try {
      // Get all bakeries in the region
      const bakeriesInRegion = await db
        .select()
        .from(bakeries)
        .where(eq(bakeries.regionId, regionId));

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
          'Failed to create bakery item stores',
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
          'Failed to delete bakery item stores',
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
      // Validate bakery exists
      const [bakeryExists] = await db
        .select({ id: bakeries.id })
        .from(bakeries)
        .where(eq(bakeries.id, bakeryId))
        .limit(1);

      if (!bakeryExists) {
        throw new NotFoundException(
          errorResponse('Bakery not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
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
          let product = null;
          let finalOptionsStock = store.optionsStock || [];

          // Fetch product based on type
          if (store.addonId) {
            const [addonData] = await db
              .select({
                id: addons.id,
                name: addons.name,
                description: addons.description,
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

      this.logger.debug(`Retrieved ${enrichedStores.length} item stores for bakery ${bakeryId}`);

      return successResponse(
        enrichedStores,
        'Bakery item stores retrieved successfully',
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
          'Failed to retrieve bakery item stores',
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
          errorResponse('Item store not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      // Validate stock is non-negative
      if (stock < 0) {
        throw new BadRequestException(
          errorResponse('Stock cannot be negative', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      // Validate each stock option is non-negative
      if (optionsStock) {
        for (const option of optionsStock) {
          if (option.stock < 0) {
            throw new BadRequestException(
              errorResponse(
                'Option stock cannot be negative',
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
        'Stock updated successfully',
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
          'Failed to update stock',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
