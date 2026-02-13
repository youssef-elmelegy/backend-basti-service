import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { wishlistItems, featuredCakes, tags, sweets } from '@/db/schema';
import { eq, and, getTableColumns } from 'drizzle-orm';
import { CreateWishlistSweetResponseDto, CreateWishlistFeaturedCakeResponseDto } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class WishlistItemsService {
  private readonly logger = new Logger(WishlistItemsService.name);

  async addFeaturedCakeToWishlist(
    userId: string,
    featuredCakeId: string,
  ): Promise<SuccessResponse<CreateWishlistFeaturedCakeResponseDto>> {
    const [featuredCake] = await db
      .select({
        ...getTableColumns(featuredCakes),
        tagName: tags.name,
      })
      .from(featuredCakes)
      .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
      .where(eq(featuredCakes.id, featuredCakeId))
      .limit(1);

    if (!featuredCake) {
      throw new NotFoundException(
        errorResponse('Featured cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(eq(wishlistItems.userId, userId), eq(wishlistItems.featuredCakeId, featuredCakeId)),
      )
      .limit(1);
    if (existingItem) {
      throw new ConflictException(
        errorResponse('Featured cake is already in the wishlist', HttpStatus.CONFLICT, 'Conflict'),
      );
    }

    try {
      const [newWishlistItem] = await db
        .insert(wishlistItems)
        .values({
          userId,
          featuredCakeId,
        })
        .returning();

      this.logger.log(`Added featured cake ${featuredCakeId} to wishlist for user ${userId}`);

      return successResponse(
        {
          wishlistItemId: newWishlistItem.id,
          featuredCake: {
            ...featuredCake,
            createdAt: featuredCake.createdAt.toISOString(),
            updatedAt: featuredCake.updatedAt.toISOString(),
          },
          createdAt: newWishlistItem.createdAt.toISOString(),
        },
        'Featured cake added to wishlist successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Error adding featured cake to wishlist`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to add featured cake to wishlist',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addSweetToWishlist(
    userId: string,
    sweetId: string,
  ): Promise<SuccessResponse<CreateWishlistSweetResponseDto>> {
    const [sweet] = await db
      .select({
        ...getTableColumns(sweets),
        tagName: tags.name,
      })
      .from(sweets)
      .leftJoin(tags, eq(sweets.tagId, tags.id))
      .where(eq(sweets.id, sweetId))
      .limit(1);

    if (!sweet) {
      throw new NotFoundException(
        errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    const [existingItem] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.sweetId, sweetId)))
      .limit(1);
    if (existingItem) {
      throw new ConflictException(
        errorResponse('Sweet is already in the wishlist', HttpStatus.CONFLICT, 'Conflict'),
      );
    }

    try {
      const [newWishlistItem] = await db
        .insert(wishlistItems)
        .values({
          userId,
          sweetId,
        })
        .returning();

      this.logger.log(`Added sweet ${sweetId} to wishlist for user ${userId}`);

      return successResponse(
        {
          wishlistItemId: newWishlistItem.id,
          sweet: sweet,
          createdAt: newWishlistItem.createdAt.toISOString(),
        },
        'Sweet added to wishlist successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Error adding sweet to wishlist`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to add sweet to wishlist',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
