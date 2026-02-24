import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateDecorationDto,
  UpdateDecorationDto,
  GetDecorationsQueryDto,
  DecorationDataDto,
  CreateDecorationRegionItemPriceDto,
  DecorationSortBy,
  CreateDecorationWithVariantImagesDto,
} from '../dto';
import { db } from '@/db';
import {
  decorations,
  tags,
  regionItemPrices,
  regions,
  shapeVariantImages,
  shapes,
} from '@/db/schema';
import { eq, desc, asc, sql, and, inArray } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class DecorationService {
  private readonly logger = new Logger(DecorationService.name);

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

  /**
   * Map decoration data to response DTO
   */
  private mapToDecorationResponse(
    decoration: typeof decorations.$inferSelect,
    tagName?: string,
    price?: string,
  ): DecorationDataDto {
    const dto: DecorationDataDto = {
      id: decoration.id,
      title: decoration.title,
      description: decoration.description,
      decorationUrl: decoration.decorationUrl,
      tagId: decoration.tagId,
      tagName,
      createdAt: decoration.createdAt,
      updatedAt: decoration.updatedAt,
    };
    if (price != null) {
      dto.price = price;
    }
    return dto;
  }

  async create(createDto: CreateDecorationDto): Promise<SuccessResponse<DecorationDataDto>> {
    try {
      // Validate tag exists if tagId is provided
      if (createDto.tagId) {
        await this.validateTagExists(createDto.tagId);
      }

      const [newDecoration] = await db
        .insert(decorations)
        .values({
          title: createDto.title,
          description: createDto.description,
          decorationUrl: createDto.decorationUrl,
          tagId: createDto.tagId,
        })
        .returning();

      let tagName: string;
      if (newDecoration.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, newDecoration.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Decoration created: ${newDecoration.id}`);
      return successResponse(
        this.mapToDecorationResponse(newDecoration, tagName),
        'Decoration created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Decoration creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create decoration',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Find decorations by both shapeId and regionId (returns variant images and pricing)
   */
  private async findDecorationsByShapeAndRegion(
    query: GetDecorationsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: DecorationDataDto[];
    total: number;
    totalPages: number;
  }> {
    // Validate shape exists
    const shapeExists = await db
      .select({ id: shapes.id })
      .from(shapes)
      .where(eq(shapes.id, query.shapeId))
      .limit(1);

    if (!shapeExists.length) {
      throw new BadRequestException(
        errorResponse('Shape not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    // Validate region exists
    const regionExists = await db
      .select({ id: regions.id })
      .from(regions)
      .where(eq(regions.id, query.regionId))
      .limit(1);

    if (!regionExists.length) {
      throw new BadRequestException(
        errorResponse('Region not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    const shapeJoinConditions = [
      eq(shapeVariantImages.decorationId, decorations.id),
      eq(shapeVariantImages.shapeId, query.shapeId),
    ] as const;

    const regionJoinConditions = [
      eq(regionItemPrices.decorationId, decorations.id),
      eq(regionItemPrices.regionId, query.regionId),
    ] as const;

    let allDecorationsResult: Array<{
      decoration: typeof decorations.$inferSelect;
      image: typeof shapeVariantImages.$inferSelect;
      pricing: typeof regionItemPrices.$inferSelect;
      tagName: string;
    }> = [];
    let total = 0;

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const whereCondition = sql`LOWER(${decorations.title}) LIKE LOWER(${searchPattern})`;

      allDecorationsResult = await db
        .select({
          decoration: decorations,
          image: shapeVariantImages,
          pricing: regionItemPrices,
          tagName: tags.name,
        })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions))
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .where(whereCondition)
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);

      const [{ count: searchCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions))
        .where(whereCondition);
      total = Number(searchCount);
    } else {
      allDecorationsResult = await db
        .select({
          decoration: decorations,
          image: shapeVariantImages,
          pricing: regionItemPrices,
          tagName: tags.name,
        })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions))
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);

      const [{ count: combinedCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions));
      total = Number(combinedCount);
    }

    // Group by decoration and include images and pricing
    const groupedDecorations = new Map<string, DecorationDataDto>();
    allDecorationsResult.forEach((row) => {
      const decorationId = row.decoration.id;
      if (!groupedDecorations.has(decorationId)) {
        groupedDecorations.set(decorationId, {
          ...this.mapToDecorationResponse(row.decoration, row.tagName),
          variantImages: [],
          price: row.pricing.price,
        });
      }
      const decorationEntry = groupedDecorations.get(decorationId);
      if (decorationEntry && decorationEntry.variantImages) {
        decorationEntry.variantImages.push({
          id: row.image.id,
          sideViewUrl: row.image.sideViewUrl,
          frontViewUrl: row.image.frontViewUrl,
          topViewUrl: row.image.topViewUrl,
          createdAt: row.image.createdAt,
          updatedAt: row.image.updatedAt,
        });
      }
    });

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: Array.from(groupedDecorations.values()),
      total,
      totalPages,
    };
  }

  /**
   * Find decorations by shapeId (returns variant images)
   */
  private async findDecorationsByShape(
    query: GetDecorationsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: DecorationDataDto[];
    total: number;
    totalPages: number;
  }> {
    // Validate shape exists
    const shapeExists = await db
      .select({ id: shapes.id })
      .from(shapes)
      .where(eq(shapes.id, query.shapeId))
      .limit(1);

    if (!shapeExists.length) {
      throw new BadRequestException(
        errorResponse('Shape not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    const joinConditions = [
      eq(shapeVariantImages.decorationId, decorations.id),
      eq(shapeVariantImages.shapeId, query.shapeId),
    ] as const;

    let allDecorationsResult: Array<{
      decoration: typeof decorations.$inferSelect;
      image: typeof shapeVariantImages.$inferSelect;
      tagName: string;
    }> = [];
    let total = 0;

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const whereCondition = sql`LOWER(${decorations.title}) LIKE LOWER(${searchPattern})`;

      allDecorationsResult = await db
        .select({
          decoration: decorations,
          image: shapeVariantImages,
          tagName: tags.name,
        })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...joinConditions))
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .where(whereCondition)
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);

      const [{ count: searchCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...joinConditions))
        .where(whereCondition);
      total = Number(searchCount);
    } else {
      allDecorationsResult = await db
        .select({
          decoration: decorations,
          image: shapeVariantImages,
          tagName: tags.name,
        })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...joinConditions))
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);

      const [{ count: shapeCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
        .from(decorations)
        .innerJoin(shapeVariantImages, and(...joinConditions));
      total = Number(shapeCount);
    }

    // Group by decoration and include images
    const groupedDecorations = new Map<string, DecorationDataDto>();
    allDecorationsResult.forEach((row) => {
      const decorationId = row.decoration.id;
      if (!groupedDecorations.has(decorationId)) {
        groupedDecorations.set(decorationId, {
          ...this.mapToDecorationResponse(row.decoration, row.tagName),
          variantImages: [],
        });
      }
      const decorationEntry = groupedDecorations.get(decorationId);
      if (decorationEntry && decorationEntry.variantImages) {
        decorationEntry.variantImages.push({
          id: row.image.id,
          sideViewUrl: row.image.sideViewUrl,
          frontViewUrl: row.image.frontViewUrl,
          topViewUrl: row.image.topViewUrl,
          createdAt: row.image.createdAt,
          updatedAt: row.image.updatedAt,
        });
      }
    });

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: Array.from(groupedDecorations.values()),
      total,
      totalPages,
    };
  }

  /**
   * Find decorations by regionId (returns pricing)
   */
  private async findDecorationsByRegion(
    query: GetDecorationsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: DecorationDataDto[];
    total: number;
    totalPages: number;
  }> {
    const joinConditions = [
      eq(regionItemPrices.decorationId, decorations.id),
      eq(regionItemPrices.regionId, query.regionId),
    ] as const;

    let allDecorationsResult: Array<{
      decoration: typeof decorations.$inferSelect;
      pricing: typeof regionItemPrices.$inferSelect;
      tagName: string;
    }> = [];
    let total = 0;

    // If search is also provided, combine both filters
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const whereCondition = sql`LOWER(${decorations.title}) LIKE LOWER(${searchPattern})`;

      const [{ count: combinedCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
        .from(decorations)
        .innerJoin(regionItemPrices, and(...joinConditions))
        .where(whereCondition);

      total = Number(combinedCount);

      allDecorationsResult = await db
        .select({
          decoration: decorations,
          pricing: regionItemPrices,
          tagName: tags.name,
        })
        .from(decorations)
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .innerJoin(regionItemPrices, and(...joinConditions))
        .where(whereCondition)
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);
    } else {
      // Only regionId, no search
      const [{ count: regionCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
        .from(decorations)
        .innerJoin(regionItemPrices, and(...joinConditions));

      total = Number(regionCount);

      allDecorationsResult = await db
        .select({
          decoration: decorations,
          pricing: regionItemPrices,
          tagName: tags.name,
        })
        .from(decorations)
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .innerJoin(regionItemPrices, and(...joinConditions))
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);
    }

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: allDecorationsResult.map((row) =>
        this.mapToDecorationResponse(row.decoration, row.tagName, row.pricing?.price),
      ),
      total,
      totalPages,
    };
  }

  /**
   * Find decorations by tag
   */
  private async findDecorationsByTag(
    query: GetDecorationsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: DecorationDataDto[];
    total: number;
    totalPages: number;
  }> {
    const [{ count: tagCount }] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
      .from(decorations)
      .where(eq(decorations.tagId, query.tagId));

    const total = Number(tagCount);

    const allDecorationsResult = await db
      .select({
        decoration: decorations,
        tagName: tags.name,
      })
      .from(decorations)
      .leftJoin(tags, eq(decorations.tagId, tags.id))
      .where(eq(decorations.tagId, query.tagId))
      .orderBy(sortOrder(sortColumn))
      .limit(query.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: allDecorationsResult.map((row) =>
        this.mapToDecorationResponse(row.decoration, row.tagName),
      ),
      total,
      totalPages,
    };
  }

  /**
   * Find decorations by search
   */
  private async findDecorationsBySearch(
    query: GetDecorationsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: DecorationDataDto[];
    total: number;
    totalPages: number;
  }> {
    const searchPattern = `%${query.search}%`;
    const [{ count: searchCount }] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${decorations.id})` })
      .from(decorations)
      .where(sql`LOWER(${decorations.title}) LIKE LOWER(${searchPattern})`);

    const total = Number(searchCount);

    const allDecorationsResult = await db
      .select({
        decoration: decorations,
        tagName: tags.name,
      })
      .from(decorations)
      .leftJoin(tags, eq(decorations.tagId, tags.id))
      .where(sql`LOWER(${decorations.title}) LIKE LOWER(${searchPattern})`)
      .orderBy(sortOrder(sortColumn))
      .limit(query.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: allDecorationsResult.map((row) =>
        this.mapToDecorationResponse(row.decoration, row.tagName),
      ),
      total,
      totalPages,
    };
  }

  /**
   * Get all decorations with pagination
   */
  private async getAllDecorations(
    query: GetDecorationsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: DecorationDataDto[];
    total: number;
    totalPages: number;
  }> {
    const [{ count: allCount }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(decorations);

    const total = Number(allCount);

    const allDecorationsResult = await db
      .select({
        decoration: decorations,
        tagName: tags.name,
      })
      .from(decorations)
      .leftJoin(tags, eq(decorations.tagId, tags.id))
      .orderBy(sortOrder(sortColumn))
      .limit(query.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: allDecorationsResult.map((row) =>
        this.mapToDecorationResponse(row.decoration, row.tagName),
      ),
      total,
      totalPages,
    };
  }

  /**
   * Get all decorations with optional filtering and pagination
   *
   * Note: Search can be combined with any filter
   */
  async findAll(query: GetDecorationsQueryDto): Promise<
    SuccessResponse<{
      items: DecorationDataDto[];
      pagination: { total: number; totalPages: number; page: number; limit: number };
    }>
  > {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn =
        query.sortBy === DecorationSortBy.TITLE ? decorations.title : decorations.createdAt;

      let result: { items: DecorationDataDto[]; total: number; totalPages: number };

      // Route to appropriate filter handler - each handler already supports search
      if (query.shapeId && query.regionId) {
        result = await this.findDecorationsByShapeAndRegion(query, offset, sortOrder, sortColumn);
      } else if (query.shapeId) {
        result = await this.findDecorationsByShape(query, offset, sortOrder, sortColumn);
      } else if (query.regionId) {
        result = await this.findDecorationsByRegion(query, offset, sortOrder, sortColumn);
      } else if (query.tagId) {
        result = await this.findDecorationsByTag(query, offset, sortOrder, sortColumn);
      } else if (query.search) {
        result = await this.findDecorationsBySearch(query, offset, sortOrder, sortColumn);
      } else {
        result = await this.getAllDecorations(query, offset, sortOrder, sortColumn);
      }

      return successResponse(
        {
          items: result.items,
          pagination: {
            total: result.total,
            totalPages: result.totalPages,
            page: query.page,
            limit: query.limit,
          },
        },
        'Decorations retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve decorations: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve decorations',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<DecorationDataDto>> {
    try {
      const result = await db
        .select({
          decoration: decorations,
          tag: {
            id: tags.id,
            tagName: tags.name,
          },
        })
        .from(decorations)
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .where(eq(decorations.id, id))
        .limit(1);

      const item = result[0];

      if (!item) {
        this.logger.warn(`Decoration not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Decoration not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      return successResponse(
        this.mapToDecorationResponse(item.decoration, item.tag?.tagName),
        'Decoration retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve decoration ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve decoration',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateDecorationDto,
  ): Promise<SuccessResponse<DecorationDataDto>> {
    try {
      // Check if decoration exists
      const existingDecoration = await db
        .select({ id: decorations.id })
        .from(decorations)
        .where(eq(decorations.id, id))
        .limit(1);

      if (!existingDecoration.length) {
        throw new NotFoundException(
          errorResponse('Decoration not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      // Validate new tag if provided
      if (updateDto.tagId) {
        await this.validateTagExists(updateDto.tagId);
      }

      // Update only provided fields
      const updateFields: Record<string, string> = {};
      if (updateDto.title !== undefined) updateFields.title = updateDto.title;
      if (updateDto.description !== undefined) updateFields.description = updateDto.description;
      if (updateDto.decorationUrl !== undefined)
        updateFields.decorationUrl = updateDto.decorationUrl;
      if (updateDto.tagId !== undefined) updateFields.tagId = updateDto.tagId;

      const [updatedDecoration] = await db
        .update(decorations)
        .set(updateFields)
        .where(eq(decorations.id, id))
        .returning();

      let tagName: string;
      if (updatedDecoration.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedDecoration.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Decoration updated: ${id}`);
      return successResponse(
        this.mapToDecorationResponse(updatedDecoration, tagName),
        'Decoration updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update decoration ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update decoration',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<null>> {
    try {
      const existingDecoration = await db
        .select({ id: decorations.id })
        .from(decorations)
        .where(eq(decorations.id, id))
        .limit(1);

      if (!existingDecoration.length) {
        throw new NotFoundException(
          errorResponse('Decoration not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(decorations).where(eq(decorations.id, id));

      this.logger.log(`Decoration deleted: ${id}`);
      return successResponse(null, 'Decoration deleted successfully', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete decoration ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete decoration',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async createRegionItemPrice(
    createDto: CreateDecorationRegionItemPriceDto,
  ): Promise<SuccessResponse<any>> {
    try {
      // Validate region exists
      const regionExists = await db
        .select({ id: regions.id })
        .from(regions)
        .where(eq(regions.id, createDto.regionId))
        .limit(1);

      if (!regionExists.length) {
        throw new BadRequestException(
          errorResponse('Region not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      // Validate decoration exists
      const decorationExists = await db
        .select({ id: decorations.id })
        .from(decorations)
        .where(eq(decorations.id, createDto.decorationId))
        .limit(1);

      if (!decorationExists.length) {
        throw new BadRequestException(
          errorResponse('Decoration not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      // Check if pricing already exists for this region and decoration
      const existingPrice: { id: string }[] = await db
        .select({ id: regionItemPrices.id })
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.decorationId, createDto.decorationId),
            eq(regionItemPrices.regionId, createDto.regionId),
          ),
        )
        .limit(1);

      let result: typeof regionItemPrices.$inferSelect;
      if (existingPrice.length) {
        // Update existing pricing
        const updateResult = await db
          .update(regionItemPrices)
          .set({
            price: String(createDto.price),
          })
          .where(eq(regionItemPrices.id, existingPrice[0].id))
          .returning();

        result = updateResult[0];
        this.logger.log(`Decoration region price updated: ${result.id}`);
        return successResponse(
          result,
          'Decoration region price updated successfully',
          HttpStatus.OK,
        );
      } else {
        // Create new pricing
        const insertResult = await db
          .insert(regionItemPrices)
          .values({
            regionId: createDto.regionId,
            decorationId: createDto.decorationId,
            price: String(createDto.price),
            addonId: null,
            featuredCakeId: null,
            sweetId: null,
            flavorId: null,
            shapeId: null,
          })
          .returning();

        result = insertResult[0];

        this.logger.log(`Decoration region price created: ${result.id}`);
        return successResponse(
          result,
          'Decoration region price created successfully',
          HttpStatus.CREATED,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create decoration region price: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create decoration region price',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async createWithVariantImages(
    createDto: CreateDecorationWithVariantImagesDto,
  ): Promise<SuccessResponse<DecorationDataDto>> {
    try {
      if (createDto.tagId) {
        await this.validateTagExists(createDto.tagId);
      }

      if (createDto.variantImages && createDto.variantImages.length > 0) {
        const shapeIds = createDto.variantImages.map((variant) => variant.shapeId);
        const existingShapes = await db
          .select({ id: shapes.id })
          .from(shapes)
          .where(inArray(shapes.id, shapeIds));

        if (existingShapes.length !== shapeIds.length) {
          const existingShapeIds = existingShapes.map((s) => s.id);
          const missingShapeIds = shapeIds.filter((id) => !existingShapeIds.includes(id));
          throw new BadRequestException(
            errorResponse(
              `Shape(s) not found: ${missingShapeIds.join(', ')}`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
            ),
          );
        }
      }

      // Create decoration
      const [newDecoration] = await db
        .insert(decorations)
        .values({
          title: createDto.title,
          description: createDto.description,
          decorationUrl: createDto.decorationUrl,
          tagId: createDto.tagId || null,
        })
        .returning();

      // Create variant images
      if (createDto.variantImages && createDto.variantImages.length > 0) {
        await db.insert(shapeVariantImages).values(
          createDto.variantImages.map((variant) => ({
            shapeId: variant.shapeId,
            flavorId: null,
            decorationId: newDecoration.id,
            sideViewUrl: variant.sideViewUrl,
            frontViewUrl: variant.frontViewUrl,
            topViewUrl: variant.topViewUrl,
          })),
        );
      }

      this.logger.log(
        `Decoration with variant images created: ${newDecoration.id} with ${createDto.variantImages?.length || 0} variants`,
      );
      return successResponse(
        this.mapToDecorationResponse(newDecoration),
        'Decoration and variant images created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Decoration creation with variant images error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create decoration with variant images',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
