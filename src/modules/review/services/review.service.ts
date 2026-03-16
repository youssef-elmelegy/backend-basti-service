import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '@/db';
import { reviews, users, orders, bakeries } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { errorResponse } from '@/utils';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  BakeyReviewsResponseDto,
} from '../dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  async create(userId: string, createDto: CreateReviewDto): Promise<ReviewResponseDto> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, createDto.orderId), eq(orders.userId, userId)))
        .limit(1);

      if (!order) {
        throw new BadRequestException(
          errorResponse(
            'Order not found or does not belong to you',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      if (order.orderStatus && order.orderStatus !== 'delivered') {
        throw new BadRequestException(
          errorResponse(
            'Order is not delivered yet',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      if (!order.bakeryId) {
        throw new BadRequestException(
          errorResponse(
            'Order does not belong to a bakery',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [bakery] = await db
        .select()
        .from(bakeries)
        .where(eq(bakeries.id, order.bakeryId))
        .limit(1);

      if (!bakery) {
        throw new BadRequestException(
          errorResponse('Bakery not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.orderId, createDto.orderId), eq(reviews.userId, userId)))
        .limit(1);

      if (existingReview) {
        throw new BadRequestException(
          errorResponse(
            'You have already reviewed this order',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [newReview] = await db
        .insert(reviews)
        .values({
          userId,
          orderId: createDto.orderId,
          bakeryId: order.bakeryId,
          rating: createDto.rating,
          reviewText: createDto.reviewText,
        })
        .returning();

      this.logger.log(`Review created: ${newReview.id} by user: ${userId}`);

      return newReview;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Review creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create review',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAllByBakery(bakeryId: string): Promise<BakeyReviewsResponseDto> {
    try {
      const bakeryReviews = await db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          orderId: reviews.orderId,
          bakeryId: reviews.bakeryId,
          rating: reviews.rating,
          reviewText: reviews.reviewText,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
          userName: users.firstName,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.bakeryId, bakeryId))
        .orderBy(desc(reviews.createdAt));

      this.logger.debug(`Retrieved ${bakeryReviews.length} reviews for bakery: ${bakeryId}`);

      return {
        reviews: bakeryReviews,
        averageRating:
          bakeryReviews.reduce((sum, review) => sum + review.rating, 0) /
          (bakeryReviews.length || 1),
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve reviews: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve reviews',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAllByUser(userId: string): Promise<ReviewResponseDto[]> {
    try {
      const userReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.userId, userId))
        .orderBy(desc(reviews.createdAt));

      this.logger.debug(`Retrieved ${userReviews.length} reviews for user: ${userId}`);

      return userReviews;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve reviews: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve reviews',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    try {
      const review = await this.findReviewOrFail(id);

      this.logger.debug(`Retrieved review: ${id}`);

      return review;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve review: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve review',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(id: string, userId: string, updateDto: UpdateReviewDto): Promise<ReviewResponseDto> {
    try {
      const review = await this.findReviewOrFail(id);

      // Verify ownership
      if (review.userId !== userId) {
        throw new ForbiddenException(
          errorResponse(
            'You are not authorized to update this review',
            HttpStatus.FORBIDDEN,
            'ForbiddenException',
          ),
        );
      }

      const [updated] = await db
        .update(reviews)
        .set({
          ...(updateDto.rating !== undefined && { rating: updateDto.rating }),
          ...(updateDto.reviewText !== undefined && { reviewText: updateDto.reviewText }),
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, id))
        .returning();

      this.logger.log(`Review updated: ${id}`);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update review: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update review',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string, userId: string): Promise<ReviewResponseDto> {
    try {
      const review = await this.findReviewOrFail(id);

      // Verify ownership
      if (review.userId !== userId) {
        throw new ForbiddenException(
          errorResponse(
            'You are not authorized to delete this review',
            HttpStatus.FORBIDDEN,
            'ForbiddenException',
          ),
        );
      }

      await db.delete(reviews).where(eq(reviews.id, id));

      this.logger.log(`Review deleted: ${id}`);

      return review;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete review: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete review',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async removeByAdmin(id: string): Promise<{ message: 'Review deleted successfully' }> {
    try {
      await this.findReviewOrFail(id);

      await db.delete(reviews).where(eq(reviews.id, id));

      this.logger.log(`Review deleted by admin: ${id}`);

      return { message: 'Review deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete review: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete review',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async findReviewOrFail(id: string) {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);

    if (!review) {
      throw new NotFoundException(
        errorResponse(`Review with ID ${id} not found`, HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    return review;
  }
}
