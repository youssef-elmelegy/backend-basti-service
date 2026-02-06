import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { wishlistItems, users, cakes, addons } from '@/db/schema';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { CreateWishlistItemDto, WishlistItemResponse, PaginationDto, SortDto } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class WishlistItemsService {
  private readonly logger = new Logger(WishlistItemsService.name);

  async create(createDto: CreateWishlistItemDto): Promise<SuccessResponse<WishlistItemResponse>> {
    const { userId, cakeId, addonId } = createDto;

    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      this.logger.warn(`Wishlist creation failed: Invalid User ID ${userId}`);
      throw new BadRequestException(
        errorResponse('User ID is invalid', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    if (cakeId) {
      const cakeExists = await db
        .select({ id: cakes.id })
        .from(cakes)
        .where(eq(cakes.id, cakeId))
        .limit(1);
      if (cakeExists.length === 0) {
        throw new BadRequestException(
          errorResponse('Cake ID is invalid', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }
      const existing = await db
        .select()
        .from(wishlistItems)
        .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.cakeId, cakeId)))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          errorResponse('Cake already in wishlist', HttpStatus.CONFLICT, 'ConflictException'),
        );
      }
    }

    if (addonId) {
      const addonExists = await db
        .select({ id: addons.id })
        .from(addons)
        .where(eq(addons.id, addonId))
        .limit(1);
      if (addonExists.length === 0) {
        throw new BadRequestException(
          errorResponse('Addon ID is invalid', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      const existing = await db
        .select()
        .from(wishlistItems)
        .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.addonId, addonId)))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          errorResponse('Addon already in wishlist', HttpStatus.CONFLICT, 'ConflictException'),
        );
      }
    }

    try {
      const [newItem] = await db
        .insert(wishlistItems)
        .values({
          userId,
          cakeId: cakeId || null,
          addonId: addonId || null,
        })
        .returning();

      this.logger.log(`Wishlist item created: ${newItem.id}`);

      // Fetch with relations for the response to be pretty
      // Note: In simple inserts, we might just return the ID, but let's be verbose
      return successResponse(
        this.formatWishlistResponse(newItem),
        'Item added to wishlist successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Wishlist creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create wishlist item',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(pagination: PaginationDto, sort: SortDto, userId?: string) {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const whereClause = userId ? eq(wishlistItems.userId, userId) : undefined;

      const [{ count: total }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(wishlistItems)
        .where(whereClause);

      const sortOrder = sort.order === 'desc' ? desc : asc;

      const allItems = await db
        .select({
          wishlist: wishlistItems,
          cake: { name: cakes.name },
          addon: { name: addons.name },
        })
        .from(wishlistItems)
        .leftJoin(cakes, eq(wishlistItems.cakeId, cakes.id))
        .leftJoin(addons, eq(wishlistItems.addonId, addons.id))
        .where(whereClause)
        .orderBy(sortOrder(wishlistItems.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const totalPages = Math.ceil(total / pagination.limit);

      const formattedItems = allItems.map((row) => ({
        ...this.formatWishlistResponse(row.wishlist),
        cakeName: row.cake?.name,
        addonName: row.addon?.name,
      }));

      return successResponse(
        {
          items: formattedItems,
          pagination: {
            total,
            totalPages,
            page: pagination.page,
            limit: pagination.limit,
          },
        },
        'Wishlist items retrieved successfully',
        HttpStatus.OK,
      );
    } catch (e) {
      this.logger.error('Failed to retrieve wishlist items', e);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve wishlist items',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<WishlistItemResponse>> {
    const result = await db
      .select({
        wishlist: wishlistItems,
        cake: { name: cakes.name },
        addon: { name: addons.name },
      })
      .from(wishlistItems)
      .leftJoin(cakes, eq(wishlistItems.cakeId, cakes.id))
      .leftJoin(addons, eq(wishlistItems.addonId, addons.id))
      .where(eq(wishlistItems.id, id))
      .limit(1);

    const item = result[0];

    if (!item) {
      this.logger.warn(`Wishlist item not found: ${id}`);
      throw new NotFoundException(
        errorResponse('Wishlist item not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    const formatted = {
      ...this.formatWishlistResponse(item.wishlist),
      cakeName: item.cake?.name,
      addonName: item.addon?.name,
    };

    return successResponse(formatted, 'Wishlist item retrieved successfully', HttpStatus.OK);
  }

  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.id, id))
      .limit(1);

    if (!existingItem) {
      this.logger.warn(`Wishlist deletion failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Wishlist item not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    try {
      await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
      this.logger.log(`Wishlist item deleted: ${id}`);

      return successResponse(
        { message: 'Wishlist item deleted successfully' },
        'Wishlist item deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Wishlist deletion error for ${id}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete wishlist item',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private formatWishlistResponse(item: typeof wishlistItems.$inferSelect): WishlistItemResponse {
    return {
      id: item.id,
      userId: item.userId,
      cakeId: item.cakeId,
      addonId: item.addonId,
      createdAt: item.createdAt,
    };
  }
}
