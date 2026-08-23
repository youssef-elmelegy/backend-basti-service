import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { db } from '@/db';
import { reviews, users, orders, bakeries, admins } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { errorResponse, SuccessResponse, successResponse } from '@/utils';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  PaginatedBakeyReviewsResponseDto,
} from '../dto';
import { PaginationDto } from '@/common/dto';
import { NotificationService } from '@/modules/notification/services/notification.service';
import { TranslationService } from '@/common';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly translationService: TranslationService,
  ) {}

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
            'routes.reviews.not_found_or_does_not_belong_to_you',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      if (order.orderStatus && order.orderStatus !== 'delivered') {
        throw new BadRequestException(
          errorResponse(
            'routes.reviews.order_is_not_delivered',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      if (!order.bakeryId) {
        throw new BadRequestException(
          errorResponse(
            'routes.reviews.order_does_not_belong_to_a_bakery',
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
          errorResponse('routes.bakery.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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
            'routes.reviews.already_reviewed',
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

      const newTotalReviews = (bakery.totalReviews || 0) + 1;
      const newAverageRating =
        ((Number(bakery.averageRating) || 0) * (bakery.totalReviews || 0) + createDto.rating) /
        newTotalReviews;

      await db
        .update(bakeries)
        .set({
          averageRating: newAverageRating.toFixed(2),
          totalReviews: newTotalReviews,
        })
        .where(eq(bakeries.id, order.bakeryId));

      this.logger.log(`Review created: ${newReview.id} by user: ${userId}`);

      const ratingStars = '★'.repeat(createDto.rating);
      await this.notificationService.pushToBakeryStaff(order.bakeryId, {
        titleKey: 'notification_templates.review_received.title',
        bodyKey: 'notification_templates.review_received.body',
        args: { rating: createDto.rating, stars: ratingStars },
        type: 'review',
        redirectId: newReview.id,
        data: {
          reviewId: newReview.id,
          bakeryId: order.bakeryId,
          rating: String(createDto.rating),
        },
      });

      await this.notificationService.pushToPlatformAdmins({
        titleKey: 'notification_templates.review_submitted.title',
        bodyKey: 'notification_templates.review_submitted.body',
        args: { rating: createDto.rating },
        type: 'review',
        redirectId: newReview.id,
        data: {
          reviewId: newReview.id,
          bakeryId: order.bakeryId,
          rating: String(createDto.rating),
        },
      });

      return newReview;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Review creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.reviews.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAllByBakery(
    bakeryId: string,
    paginationDto: PaginationDto,
    requester?: { id: string; role: string },
  ): Promise<SuccessResponse<PaginatedBakeyReviewsResponseDto>> {
    const page = paginationDto.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = paginationDto.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const offset = (page - 1) * limit;

    // Managers are scoped to their own bakery. The JWT carries only id/email/role,
    // so the assignment has to be read from the admins table rather than trusted
    // from the token or the path param.
    if (requester?.role === 'manager') {
      const [admin] = await db
        .select({ bakeryId: admins.bakeryId })
        .from(admins)
        .where(eq(admins.id, requester.id))
        .limit(1);

      if (!admin?.bakeryId || admin.bakeryId !== bakeryId) {
        this.logger.warn(
          `Manager ${requester.id} attempted to read reviews for bakery ${bakeryId}`,
        );
        throw new ForbiddenException('You can only view reviews for your own bakery');
      }
    }

    try {
      const [bakery] = await db
        .select({
          totalReviews: bakeries.totalReviews,
          averageRating: bakeries.averageRating,
        })
        .from(bakeries)
        .where(eq(bakeries.id, bakeryId))
        .limit(1);

      if (!bakery) {
        this.logger.debug(`Bakery not found: ${bakeryId}, returning empty reviews`);
        return successResponse(
          {
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            pagination: {
              total: 0,
              totalPages: 0,
              page,
              limit,
            },
          },
          'routes.reviews.no_reviews',
          HttpStatus.OK,
        );
      }

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
          firstName: this.translationService.getLocalized(users.firstName, 'firstName'),
          lastName: this.translationService.getLocalized(users.lastName, 'lastName'),
          profileImage: users.profileImage,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.bakeryId, bakeryId))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset);

      const sanitizedReviews = bakeryReviews.map((review) => ({
        ...review,
        firstName: review.firstName ?? '',
        lastName: review.lastName ?? '',
        profileImage: review.profileImage ?? '',
      }));

      this.logger.debug(
        `Retrieved ${bakeryReviews.length} reviews for bakery: ${bakeryId} (page ${page}, limit ${limit})`,
      );

      return successResponse(
        {
          reviews: sanitizedReviews,
          averageRating: Number(bakery.averageRating || '0'),
          totalReviews: bakery.totalReviews,
          pagination: {
            total: bakery.totalReviews,
            totalPages: Math.ceil(bakery.totalReviews / limit),
            page,
            limit,
          },
        },
        'routes.reviews.list_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve reviews: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.reviews.failed_list',
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
          'routes.reviews.failed_list',
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
          'routes.reviews.failed_retrieve',
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
            'routes.reviews.not_authorized',
            HttpStatus.FORBIDDEN,
            'ForbiddenException',
          ),
        );
      }

      const [bakery] = await db
        .select({
          totalReviews: bakeries.totalReviews,
          averageRating: bakeries.averageRating,
        })
        .from(bakeries)
        .where(eq(bakeries.id, review.bakeryId))
        .limit(1);

      if (!bakery) {
        throw new BadRequestException(
          errorResponse('routes.bakery.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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

      const newAverageRating =
        ((Number(bakery.averageRating) || 0) * (bakery.totalReviews || 0) + updateDto.rating) /
        bakery.totalReviews;

      await db
        .update(bakeries)
        .set({
          averageRating: newAverageRating.toFixed(2),
        })
        .where(eq(bakeries.id, review.bakeryId));

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
          'routes.reviews.failed_update',
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
            'routes.reviews.not_authorized_delete',
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
          'routes.reviews.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async removeByAdmin(id: string): Promise<{ message: string }> {
    try {
      const review = await this.findReviewOrFail(id);

      const [bakery] = await db
        .select()
        .from(bakeries)
        .where(eq(bakeries.id, review.bakeryId))
        .limit(1);

      await db.delete(reviews).where(eq(reviews.id, id));

      const newTotalReviews = bakery.totalReviews - 1;
      const newAverageRating =
        ((Number(bakery.averageRating) || 0) * (bakery.totalReviews || 0) - review.rating) /
        newTotalReviews;

      await db
        .update(bakeries)
        .set({
          averageRating: newAverageRating.toFixed(2),
          totalReviews: newTotalReviews,
        })
        .where(eq(bakeries.id, review.bakeryId));

      this.logger.log(`Review deleted by admin: ${id}`);

      return { message: 'routes.reviews.deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete review: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.reviews.failed_delete',
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
        errorResponse(
          `routes.reviews.not_found_with_id`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
          { reviewId: id },
        ),
      );
    }

    const [bakery] = await db
      .select()
      .from(bakeries)
      .where(eq(bakeries.id, review.bakeryId))
      .limit(1);
    if (!bakery) {
      throw new NotFoundException(
        errorResponse(
          `routes.bakery.not_found_with_id`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
          { bakeryId: review.bakeryId },
        ),
      );
    }

    return review;
  }
}
