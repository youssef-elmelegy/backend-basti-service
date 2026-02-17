import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateSweetDto,
  UpdateSweetDto,
  GetSweetsQueryDto,
  SweetDataDto,
  GetAllSweetsDataDto,
  DeleteSweetResponseDto,
  CreateSweetRegionItemPriceDto,
  SortBy,
} from '../dto';
import { db } from '@/db';
import { sweets, tags, regionItemPrices, regions } from '@/db/schema';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class SweetService {
  private readonly logger = new Logger(SweetService.name);

  /**
   * Validate that a tag exists by ID
   */
  private async validateTagExists(tagId: string): Promise<void> {
    const tagResult = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (tagResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `Tag with ID ${tagId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  async create(createDto: CreateSweetDto): Promise<SuccessResponse<SweetDataDto>> {
    try {
      // Validate tag exists if tagId is provided
      if (createDto.tagId) {
        await this.validateTagExists(createDto.tagId);
      }

      const [newSweet] = await db
        .insert(sweets)
        .values({
          name: createDto.name,
          description: createDto.description,
          images: createDto.images,
          sizes: createDto.sizes,
          tagId: createDto.tagId,
          isActive: createDto.isActive ?? true,
        })
        .returning();

      let tagName: string;
      if (newSweet.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, newSweet.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet created: ${newSweet.id}`);
      return successResponse(
        this.mapToSweetResponse(newSweet, tagName),
        'Sweet created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(query: GetSweetsQueryDto): Promise<SuccessResponse<GetAllSweetsDataDto>> {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn = query.sortBy === SortBy.NAME ? sweets.name : sweets.createdAt;

      let allSweetsResult: Array<{
        sweet: typeof sweets.$inferSelect;
        tagName: string;
        price?: string;
        sizesPrices?: Record<string, string>;
      }> = [];
      let total = 0;

      if (query.regionId) {
        const joinConditions = [
          eq(regionItemPrices.sweetId, sweets.id),
          eq(regionItemPrices.regionId, query.regionId),
        ] as const;

        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [];
        if (query.tag) {
          whereConditions.push(eq(tags.name, query.tag));
        }
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          whereConditions.push(sql`LOWER(${sweets.name}) LIKE LOWER(${searchPattern})`);
        }

        const [{ count: regionCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${sweets.id})` })
          .from(sweets)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        total = Number(regionCount);

        allSweetsResult = await db
          .select({
            sweet: sweets,
            tagName: tags.name,
            price: regionItemPrices.price,
            sizesPrices: regionItemPrices.sizesPrices,
          })
          .from(sweets)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      } else if (query.tag) {
        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [eq(tags.name, query.tag)];
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          whereConditions.push(sql`LOWER(${sweets.name}) LIKE LOWER(${searchPattern})`);
        }

        const [{ count: tagCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${sweets.id})` })
          .from(sweets)
          .innerJoin(tags, eq(sweets.tagId, tags.id))
          .where(and(...whereConditions));

        total = Number(tagCount);

        allSweetsResult = await db
          .select({
            sweet: sweets,
            tagName: tags.name,
          })
          .from(sweets)
          .innerJoin(tags, eq(sweets.tagId, tags.id))
          .where(and(...whereConditions))
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      } else if (query.search) {
        const searchPattern = `%${query.search}%`;
        const [{ count: searchCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${sweets.id})` })
          .from(sweets)
          .where(sql`LOWER(${sweets.name}) LIKE LOWER(${searchPattern})`);

        total = Number(searchCount);

        allSweetsResult = await db
          .select({
            sweet: sweets,
            tagName: tags.name,
          })
          .from(sweets)
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .where(sql`LOWER(${sweets.name}) LIKE LOWER(${searchPattern})`)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      } else {
        const [{ count: untaggedCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(sweets);

        total = Number(untaggedCount);

        allSweetsResult = await db
          .select({
            sweet: sweets,
            tagName: tags.name,
          })
          .from(sweets)
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      }

      const totalPages = Math.ceil(total / query.limit);

      return successResponse(
        {
          items: allSweetsResult.map((row) =>
            this.mapToSweetResponse(row.sweet, row.tagName, row.price, row.sizesPrices),
          ),
          pagination: {
            total,
            totalPages,
            page: query.page,
            limit: query.limit,
          },
        },
        'Sweets retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve sweets: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve sweets',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const result = await db
        .select({
          sweet: sweets,
          tag: {
            id: tags.id,
            tagName: tags.name,
          },
        })
        .from(sweets)
        .leftJoin(tags, eq(sweets.tagId, tags.id))
        .where(eq(sweets.id, id))
        .limit(1);

      const item = result[0];

      if (!item) {
        this.logger.warn(`Sweet not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      return successResponse(
        this.mapToSweetResponse(item.sweet, item.tag?.tagName),
        'Sweet retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve sweet ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(id: string, updateDto: UpdateSweetDto): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const [updated] = await db
        .update(sweets)
        .set({
          name: updateDto.name,
          description: updateDto.description,
          images: updateDto.images,
          sizes: updateDto.sizes,
          tagId: updateDto.tagId,
          isActive: updateDto.isActive,
          updatedAt: new Date(),
        })
        .where(eq(sweets.id, id))
        .returning();

      if (!updated) {
        this.logger.warn(`Sweet not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      let tagName: string;
      if (updated.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updated.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet updated: ${id}`);
      return successResponse(
        this.mapToSweetResponse(updated, tagName),
        'Sweet updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<DeleteSweetResponseDto>> {
    try {
      const [deleted] = await db.delete(sweets).where(eq(sweets.id, id)).returning();

      if (!deleted) {
        this.logger.warn(`Sweet not found for deletion: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      this.logger.log(`Sweet deleted: ${id}`);
      return successResponse(
        { message: 'Sweet deleted successfully' },
        'Sweet deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet deletion error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async toggleStatus(id: string): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const [existing] = await db.select().from(sweets).where(eq(sweets.id, id)).limit(1);

      if (!existing) {
        this.logger.warn(`Sweet not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [updated] = await db
        .update(sweets)
        .set({
          isActive: !existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(sweets.id, id))
        .returning();

      let tagName: string;
      if (updated.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updated.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet status toggled: ${id}`);
      return successResponse(
        this.mapToSweetResponse(updated, tagName),
        'Sweet status toggled successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet status toggle error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to toggle sweet status',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Validate that a sweet exists by ID
   */
  private async validateSweetExists(sweetId: string): Promise<void> {
    const sweetResult = await db
      .select({ id: sweets.id })
      .from(sweets)
      .where(eq(sweets.id, sweetId))
      .limit(1);

    if (sweetResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `Sweet with ID ${sweetId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  /**
   * Validate that a region exists by ID
   */
  private async validateRegionExists(regionId: string): Promise<void> {
    const regionResult = await db
      .select({ id: regions.id })
      .from(regions)
      .where(eq(regions.id, regionId))
      .limit(1);

    if (regionResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `Region with ID ${regionId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  async createRegionItemPrice(createSweetRegionItemPriceDto: CreateSweetRegionItemPriceDto) {
    const { sweetId, regionId, price, sizesPrices } = createSweetRegionItemPriceDto;

    try {
      // Validate both IDs exist
      await this.validateSweetExists(sweetId);
      await this.validateRegionExists(regionId);

      // Check if pricing already exists for this sweet and region
      const existingPrice = await db
        .select()
        .from(regionItemPrices)
        .where(and(eq(regionItemPrices.sweetId, sweetId), eq(regionItemPrices.regionId, regionId)))
        .limit(1);

      let regionItemPrice: typeof regionItemPrices.$inferSelect;
      if (existingPrice.length > 0) {
        const [updated] = await db
          .update(regionItemPrices)
          .set({
            price,
            sizesPrices: sizesPrices || null,
            updatedAt: new Date(),
          })
          .where(
            and(eq(regionItemPrices.sweetId, sweetId), eq(regionItemPrices.regionId, regionId)),
          )
          .returning();
        regionItemPrice = updated;
        this.logger.log(`Region pricing updated: sweet ${sweetId}, region ${regionId}`);
      } else {
        const [created] = await db
          .insert(regionItemPrices)
          .values({
            sweetId,
            regionId,
            price,
            sizesPrices: sizesPrices || null,
          })
          .returning();
        regionItemPrice = created;
        this.logger.log(`Region pricing created: sweet ${sweetId}, region ${regionId}`);
      }

      return successResponse(
        {
          sweetId: regionItemPrice.sweetId,
          regionId: regionItemPrice.regionId,
          price: regionItemPrice.price,
          sizesPrices: regionItemPrice.sizesPrices || undefined,
          createdAt: regionItemPrice.createdAt,
          updatedAt: regionItemPrice.updatedAt,
        },
        'Region pricing created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create region pricing: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create region pricing',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private mapToSweetResponse(
    sweet: typeof sweets.$inferSelect,
    tagName?: string,
    price?: string,
    sizesPrices?: Record<string, string>,
  ) {
    return {
      id: sweet.id,
      name: sweet.name,
      description: sweet.description,
      tagId: sweet.tagId,
      tagName: tagName || undefined,
      images: sweet.images,
      sizes: sweet.sizes,
      price: price || undefined,
      sizesPrices: sizesPrices || undefined,
      isActive: sweet.isActive,
      createdAt: sweet.createdAt,
      updatedAt: sweet.updatedAt,
    };
  }
}
