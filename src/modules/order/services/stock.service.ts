import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { db } from '@/db';
import { bakeryItemStores } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

@Injectable()
export class StockService {
  async incrementStock(bakeryId: string, regionItemPriceId: string, quantity: number) {
    try {
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
    } catch {
      throw new InternalServerErrorException('Failed to increment stock');
    }
  }

  async decrementStock(bakeryId: string, regionItemPriceId: string, quantity: number) {
    try {
      const [currentStock] = await db
        .select({ stock: bakeryItemStores.stock })
        .from(bakeryItemStores)
        .where(
          and(
            eq(bakeryItemStores.bakeryId, bakeryId),
            eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
          ),
        )
        .limit(1);

      if (!currentStock || currentStock.stock < quantity) {
        throw new BadRequestException('Not enough stock available');
      }

      await db
        .update(bakeryItemStores)
        .set({
          stock: sql`${bakeryItemStores.stock} - ${quantity}`,
        })
        .where(
          and(
            eq(bakeryItemStores.bakeryId, bakeryId),
            eq(bakeryItemStores.regionItemPriceId, regionItemPriceId),
          ),
        );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to decrement stock');
    }
  }
}
