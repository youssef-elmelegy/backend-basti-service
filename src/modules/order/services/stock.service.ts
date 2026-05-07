import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { db } from '@/db';
import { bakeryItemStores } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

@Injectable()
export class StockService {

  async incrementStock(
    bakeryId: string,
    regionItemPriceId: string,
    quantity: number,
    optionId?: string | null,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('routes.Stock.invalid_quantity');
    }

    try {
      const [currentStock] = await db
        .select({
          stock: bakeryItemStores.stock,
          optionsStock: bakeryItemStores.optionsStock,
        })
        .from(bakeryItemStores)
        .where(
          and(
            eq(bakeryItemStores.bakeryId, bakeryId),
            eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
          ),
        )
        .limit(1);

      if (!currentStock) {
        throw new BadRequestException('routes.Stock.item_store_not_found');
      }

      if (optionId) {
        if (
          !currentStock.optionsStock ||
          !currentStock.optionsStock.find((option) => option.optionId === optionId)
        ) {
          throw new BadRequestException('routes.Stock.option_not_in_stock');
        }

        const newOptionStock = currentStock.optionsStock.map((option) => {
          if (option.optionId === optionId) {
            return {
              ...option,
              stock: option.stock + quantity,
            };
          }
          return option;
        });

        await db
          .update(bakeryItemStores)
          .set({
            optionsStock: newOptionStock,
            stock: currentStock.stock + quantity,
          })
          .where(
            and(
              eq(bakeryItemStores.bakeryId, bakeryId),
              eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
            ),
          );
      } else {
        await db
          .update(bakeryItemStores)
          .set({
            stock: sql`${bakeryItemStores.stock} + ${quantity}`,
          })
          .where(
            and(
              eq(bakeryItemStores.bakeryId, bakeryId),
              eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
            ),
          );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('routes.Stock.failed_increment');
    }
  }

  async decrementStock(
    bakeryId: string,
    regionItemPriceId: string,
    quantity: number,
    optionId?: string | null,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('routes.Stock.invalid_quantity');
    }

    try {
      const [currentStock] = await db
        .select({
          stock: bakeryItemStores.stock,
          optionsStock: bakeryItemStores.optionsStock,
        })
        .from(bakeryItemStores)
        .where(
          and(
            eq(bakeryItemStores.bakeryId, bakeryId),
            eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
          ),
        )
        .limit(1);

      if (!currentStock) {
        throw new BadRequestException('routes.Stock.item_store_not_found');
      }

      if (currentStock.stock < quantity) {
        throw new BadRequestException('routes.Stock.not_enough_stock');
      }

      if (optionId) {
        const optionsStock = currentStock.optionsStock;

        if (!optionsStock) {
          throw new BadRequestException('routes.Stock.option_not_in_stock');
        }

        const targetOption = optionsStock.find((option) => option.optionId === optionId);

        if (!targetOption) {
          throw new BadRequestException('routes.Stock.option_not_in_stock');
        }

        if (targetOption.stock < quantity) {
          throw new BadRequestException('routes.Stock.not_enough_stock');
        }

        const newOptionStock = optionsStock.map((option) => {
          if (option.optionId === optionId) {
            return {
              ...option,
              stock: option.stock - quantity,
            };
          }
          return option;
        });

        await db
          .update(bakeryItemStores)
          .set({
            optionsStock: newOptionStock,
            stock: currentStock.stock - quantity,
          })
          .where(
            and(
              eq(bakeryItemStores.bakeryId, bakeryId),
              eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
            ),
          );
      } else {
        await db
          .update(bakeryItemStores)
          .set({
            stock: sql`${bakeryItemStores.stock} - ${quantity}`,
          })
          .where(
            and(
              eq(bakeryItemStores.bakeryId, bakeryId),
              eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
              gte(bakeryItemStores.stock, quantity),
            ),
          );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('routes.Stock.failed_decrement');
    }
  }
}
