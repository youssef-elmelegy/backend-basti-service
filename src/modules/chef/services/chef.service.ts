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
import { eq, sql, asc, desc, and, getTableColumns } from 'drizzle-orm';
import {
  CreateChefDto,
  UpdateChefDto,
  PaginationDto,
  ChefResponse,
  PaginatedChefResponse,
  SortDto,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';
import { TranslationService } from '@/common/translation/translation.service';

@Injectable()
export class ChefService {
  private readonly logger = new Logger(ChefService.name);

  constructor(private readonly translationService: TranslationService) {}

  async create(createChefDto: CreateChefDto): Promise<SuccessResponse<ChefResponse>> {
    const { name, specialization, image, bio, bakeryId } = createChefDto;

    const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

    if (!bakery) {
      this.logger.warn(`Chef creation failed: Bakery not found - ${bakeryId}`);
      throw new BadRequestException(
        errorResponse('routes.bakery.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    const specializationObject = await this.translationService.getTranslationObject(specialization);
    const bioObject = await this.translationService.getTranslationObject(bio);

    try {
      const [newChef] = await db
        .insert(chefs)
        .values({
          fullName: name,
          specialization: specializationObject,
          image,
          bio: bioObject,
          bakeryId,
        })
        .returning({
          ...getTableColumns(chefs),
          specialization: this.translationService.getLocalized(
            chefs.specialization,
            'specialization',
          ),
          bio: this.translationService.getLocalized(chefs.bio, 'bio'),
        });

      this.logger.log(`Chef created: ${newChef.id} (${name})`);

      return successResponse(
        await this.formatChefResponse(newChef.id),
        'routes.chef.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chef creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.chef.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(
    pagination: PaginationDto,
    sort: SortDto,
    regionId?: string,
  ): Promise<SuccessResponse<PaginatedChefResponse>> {
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT } = pagination;

    try {
      const conditions = regionId ? [eq(bakeries.regionId, regionId)] : [];

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(chefs)
        .innerJoin(bakeries, eq(chefs.bakeryId, bakeries.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalCount = Number(count);
      const totalPages = Math.ceil(totalCount / limit);
      const offset = (page - 1) * limit;

      const sortOrder = sort.order === 'desc' ? desc : asc;

      const query = db
        .select({ chef: chefs })
        .from(chefs)
        .innerJoin(bakeries, eq(chefs.bakeryId, bakeries.id));

      if (regionId) {
        query.where(eq(bakeries.regionId, regionId));
      }

      const allChefs = await query
        .orderBy(sort.sort === 'alpha' ? sortOrder(chefs.fullName) : sortOrder(chefs.createdAt))
        .limit(limit)
        .offset(offset);

      const formattedChefs = await Promise.all(
        allChefs.map((result) => this.formatChefResponse(result.chef.id)),
      );

      this.logger.debug(
        `Retrieved ${allChefs.length} chefs (page ${page}/${totalPages}) ${regionId ? `for region ${regionId}` : ''}`,
      );

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
        'routes.chef.list_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve chefs: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.chef.failed_list',
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
        errorResponse('routes.chef.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Chef retrieved: ${id}`);

    return successResponse(
      await this.formatChefResponse(id),
      'routes.chef.retrieved',
      HttpStatus.OK,
    );
  }

  async update(id: string, updateChefDto: UpdateChefDto): Promise<SuccessResponse<ChefResponse>> {
    const { name, specialization, image, bio, bakeryId } = updateChefDto;

    const [existingChef] = await db.select().from(chefs).where(eq(chefs.id, id)).limit(1);

    if (!existingChef) {
      this.logger.warn(`Chef update failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('routes.chef.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (bakeryId) {
      const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

      if (!bakery) {
        this.logger.warn(`Chef update failed: Bakery not found - ${bakeryId}`);
        throw new BadRequestException(
          errorResponse('routes.bakery.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }
    }

    const updateData: Record<string, any> = {};

    if (name !== undefined) {
      updateData.fullName = name;
    }
    if (specialization !== undefined) {
      updateData.specialization =
        await this.translationService.getTranslationObject(specialization);
    }
    if (bio !== undefined) {
      updateData.bio = await this.translationService.getTranslationObject(bio);
    }
    if (image !== undefined) updateData.image = image;
    if (bakeryId !== undefined) updateData.bakeryId = bakeryId;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        errorResponse(
          'routes.common.no_fields_to_update',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    try {
      await db.update(chefs).set(updateData).where(eq(chefs.id, id));

      this.logger.log(`Chef updated: ${id}`);

      return successResponse(
        await this.formatChefResponse(id),
        'routes.chef.updated',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chef update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.chef.failed_update',
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
        errorResponse('routes.chef.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    try {
      await db.delete(chefs).where(eq(chefs.id, id));

      this.logger.log(`Chef deleted: ${id}`);

      return successResponse(
        { message: 'routes.chef.deleted' },
        'routes.chef.deleted',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chef deletion error for ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.chef.failed_delete',
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
    const [chef] = await db
      .select({
        ...getTableColumns(chefs),
        specialization: this.translationService.getLocalized(
          chefs.specialization,
          'specialization',
        ),
        bio: this.translationService.getLocalized(chefs.bio, 'bio'),
      })
      .from(chefs)
      .where(eq(chefs.id, chefId))
      .limit(1);

    return {
      id: chef.id,
      name: chef.fullName,
      specialization: chef.specialization,
      image: chef.image ?? undefined,
      bio: chef.bio ?? null,
      bakeryId: chef.bakeryId,
      createdAt: chef.createdAt,
      updatedAt: chef.updatedAt,
    };
  }
}
