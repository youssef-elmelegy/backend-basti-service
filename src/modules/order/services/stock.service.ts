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
    force = false,
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
        // Releasing stock should never block an order move: if the bakery has no
        // record for this item there is simply nothing to credit back.
        if (force) {
          return;
        }
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
    force = false,
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
        // Forced (admin override) moves tolerate a bakery that has no stock record
        // for this item — there's nothing to reserve, so just skip it.
        if (force) {
          return;
        }
        throw new BadRequestException('routes.Stock.item_store_not_found');
      }

      if (currentStock.stock < quantity && !force) {
        throw new BadRequestException('routes.Stock.not_enough_stock');
      }

      if (optionId) {
        const optionsStock = currentStock.optionsStock;
        const targetOption = optionsStock?.find((option) => option.optionId === optionId);

        if (!optionsStock || !targetOption) {
          if (force) {
            // The option isn't tracked here; clamp the aggregate stock and move on.
            await db
              .update(bakeryItemStores)
              .set({ stock: Math.max(0, currentStock.stock - quantity) })
              .where(
                and(
                  eq(bakeryItemStores.bakeryId, bakeryId),
                  eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
                ),
              );
            return;
          }
          throw new BadRequestException('routes.Stock.option_not_in_stock');
        }

        if (targetOption.stock < quantity && !force) {
          throw new BadRequestException('routes.Stock.not_enough_stock');
        }

        const newOptionStock = optionsStock.map((option) =>
          option.optionId === optionId
            ? { ...option, stock: Math.max(0, option.stock - quantity) }
            : option,
        );

        await db
          .update(bakeryItemStores)
          .set({
            optionsStock: newOptionStock,
            stock: Math.max(0, currentStock.stock - quantity),
          })
          .where(
            and(
              eq(bakeryItemStores.bakeryId, bakeryId),
              eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
            ),
          );
      } else if (force) {
        // Best-effort: never drive aggregate stock below zero.
        await db
          .update(bakeryItemStores)
          .set({ stock: sql`GREATEST(${bakeryItemStores.stock} - ${quantity}, 0)` })
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
