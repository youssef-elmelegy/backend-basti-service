import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { chefs, bakeries } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  CreateChefDto,
  UpdateChefDto,
  PaginationDto,
  ChefResponse,
  PaginatedChefResponse,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';

@Injectable()
export class ChefService {
  private readonly logger = new Logger(ChefService.name);

  async create(createChefDto: CreateChefDto): Promise<SuccessResponse<ChefResponse>> {
    const { name, specialization, image, bakeryId } = createChefDto;

    const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

    if (!bakery) {
      this.logger.warn(`Chef creation failed: Bakery not found - ${bakeryId}`);
      throw new BadRequestException(
        errorResponse('Bakery not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    try {
      const [newChef] = await db
        .insert(chefs)
        .values({
          fullName: name,
          specialization,
          image,
          bakeryId,
        })
        .returning();

      this.logger.log(`Chef created: ${newChef.id} (${name})`);

      return successResponse(
        await this.formatChefResponse(newChef.id),
        'Chef created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chef creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create chef',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<SuccessResponse<PaginatedChefResponse>> {
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT } = paginationDto;

    try {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(chefs);

      const totalCount = Number(count);
      const totalPages = Math.ceil(totalCount / limit);
      const offset = (page - 1) * limit;

      const allChefs = await db.select().from(chefs).limit(limit).offset(offset);

      const formattedChefs = await Promise.all(
        allChefs.map((chef) => this.formatChefResponse(chef.id)),
      );

      this.logger.debug(`Retrieved ${allChefs.length} chefs (page ${page}/${totalPages})`);

      return successResponse(
        {
          items: formattedChefs,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
          },
        },
        'Chefs retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve chefs: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve chefs',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<ChefResponse>> {
    const [chef] = await db.select().from(chefs).where(eq(chefs.id, id)).limit(1);

    if (!chef) {
      this.logger.warn(`Chef not found: ${id}`);
      throw new NotFoundException(
        errorResponse('Chef not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Chef retrieved: ${id}`);

    return successResponse(
      await this.formatChefResponse(id),
      'Chef retrieved successfully',
      HttpStatus.OK,
    );
  }

  async update(id: string, updateChefDto: UpdateChefDto): Promise<SuccessResponse<ChefResponse>> {
    const { name, specialization, image, bakeryId } = updateChefDto;

    const [existingChef] = await db.select().from(chefs).where(eq(chefs.id, id)).limit(1);

    if (!existingChef) {
      this.logger.warn(`Chef update failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Chef not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (bakeryId) {
      const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

      if (!bakery) {
        this.logger.warn(`Chef update failed: Bakery not found - ${bakeryId}`);
        throw new BadRequestException(
          errorResponse('Bakery not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }
    }

    try {
      await db
        .update(chefs)
        .set({
          ...(name && { fullName: name }),
          ...(specialization && { specialization }),
          ...(image !== undefined && { image }),
          ...(bakeryId && { bakeryId }),
          updatedAt: new Date(),
        })
        .where(eq(chefs.id, id));

      this.logger.log(`Chef updated: ${id}`);

      return successResponse(
        await this.formatChefResponse(id),
        'Chef updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chef update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update chef',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    const [existingChef] = await db.select().from(chefs).where(eq(chefs.id, id)).limit(1);

    if (!existingChef) {
      this.logger.warn(`Chef deletion failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Chef not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    try {
      await db.delete(chefs).where(eq(chefs.id, id));

      this.logger.log(`Chef deleted: ${id}`);

      return successResponse(
        { message: 'Chef deleted successfully' },
        'Chef deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chef deletion error for ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete chef',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  // async rateChef(
  //   chefId: string,
  //   userId: string,
  //   rateChefDto: RateChefDto,
  // ): Promise<SuccessResponse<{ id: string; name: string; rating: number; ratingCount: number }>> {
  //   const { rating, comment } = rateChefDto;

  //   const [chef] = await db.select().from(chefs).where(eq(chefs.id, chefId)).limit(1);

  //   if (!chef) {
  //     this.logger.warn(`Chef rating failed: Not found - ${chefId}`);
  //     throw new NotFoundException(
  //       errorResponse('Chef not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
  //     );
  //   }

  //   try {
  //     // Check if user already rated this chef
  //     const [existingRating]: { id: string }[] = await db
  //       .select()
  //       .from(chefRatings)
  //       .where(and(eq(chefRatings.chefId, chefId), eq(chefRatings.userId, userId)))
  //       .limit(1);

  //     if (existingRating) {
  //       // Update existing rating
  //       await db
  //         .update(chefRatings)
  //         .set({
  //           rating,
  //           comment,
  //           updatedAt: new Date(),
  //         })
  //         .where(eq(chefRatings.id, existingRating.id));
  //     } else {
  //       // Create new rating
  //       await db.insert(chefRatings).values({
  //         chefId,
  //         userId,
  //         rating,
  //         comment,
  //       });
  //     }

  //     // Recalculate chef rating
  //     const [{ avgRating, count }] = await db
  //       .select({
  //         avgRating: sql<number>`AVG(${chefRatings.rating})::decimal(3,2)`,
  //         count: sql<number>`COUNT(*)::int`,
  //       })
  //       .from(chefRatings)
  //       .where(eq(chefRatings.chefId, chefId));

  //     const newRating = Number(avgRating) || 0;
  //     const ratingCount = Number(count) || 0;

  //     // Update chef rating
  //     await db
  //       .update(chefs)
  //       .set({
  //         rating: newRating.toFixed(2),
  //         ratingCount,
  //         updatedAt: new Date(),
  //       })
  //       .where(eq(chefs.id, chefId));

  //     this.logger.log(`Chef rated: ${chefId} (new rating: ${newRating})`);

  //     return successResponse(
  //       {
  //         id: chef.id,
  //         name: chef.name,
  //         rating: newRating,
  //         ratingCount,
  //       },
  //       'Chef rated successfully',
  //       HttpStatus.OK,
  //     );
  //   } catch (error) {
  //     const errMsg = error instanceof Error ? error.message : String(error);
  //     this.logger.error(`Chef rating error: ${errMsg}`);
  //     throw new InternalServerErrorException(
  //       errorResponse(
  //         'Failed to rate chef',
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //         'InternalServerError',
  //       ),
  //     );
  //   }
  // }

  private async formatChefResponse(chefId: string): Promise<ChefResponse> {
    const [chef] = await db.select().from(chefs).where(eq(chefs.id, chefId)).limit(1);

    return {
      id: chef.id,
      name: chef.fullName,
      specialization: chef.specialization,
      image: chef.image ?? null,
      bakeryId: chef.bakeryId,
      createdAt: chef.createdAt,
      updatedAt: chef.updatedAt,
    };
  }
}
