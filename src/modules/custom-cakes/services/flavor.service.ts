import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateFlavorDto,
  UpdateFlavorDto,
  GetFlavorsQueryDto,
  FlavorDataDto,
  CreateFlavorRegionItemPriceDto,
  FlavorSortBy,
  CreateFlavorWithVariantImagesDto,
  FlavorWithVariantImagesDto,
} from '../dto';
import { db } from '@/db';
import { flavors, regionItemPrices, regions, shapeVariantImages, shapes } from '@/db/schema';
import { eq, desc, asc, sql, and, inArray } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class FlavorService {
  private readonly logger = new Logger(FlavorService.name);

  /**
   * Map flavor data to response DTO
   */
  private mapToFlavorResponse(flavor: typeof flavors.$inferSelect): FlavorDataDto {
    return {
      id: flavor.id,
      title: flavor.title,
      description: flavor.description,
      flavorUrl: flavor.flavorUrl,
      createdAt: flavor.createdAt,
      updatedAt: flavor.updatedAt,
    };
  }

  async create(createDto: CreateFlavorDto): Promise<SuccessResponse<FlavorDataDto>> {
    try {
      const [newFlavor] = await db
        .insert(flavors)
        .values({
          title: createDto.title,
          description: createDto.description,
          flavorUrl: createDto.flavorUrl,
        })
        .returning();

      this.logger.log(`Flavor created: ${newFlavor.id}`);
      return successResponse(
        this.mapToFlavorResponse(newFlavor),
        'Flavor created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Flavor creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create flavor',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Find flavors by both shapeId and regionId (returns variant images and pricing)
   */
  private async findFlavorsByShapeAndRegion(
    query: GetFlavorsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: FlavorWithVariantImagesDto[];
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
      eq(shapeVariantImages.flavorId, flavors.id),
      eq(shapeVariantImages.shapeId, query.shapeId),
    ] as const;

    const regionJoinConditions = [
      eq(regionItemPrices.flavorId, flavors.id),
      eq(regionItemPrices.regionId, query.regionId),
    ] as const;

    let allFlavorsResult: Array<{
      flavor: typeof flavors.$inferSelect;
      image: typeof shapeVariantImages.$inferSelect;
      pricing: typeof regionItemPrices.$inferSelect;
    }> = [];

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const whereCondition = sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`;

      allFlavorsResult = await db
        .select({
          flavor: flavors,
          image: shapeVariantImages,
          pricing: regionItemPrices,
        })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions))
        .where(whereCondition)
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);
    } else {
      allFlavorsResult = await db
        .select({
          flavor: flavors,
          image: shapeVariantImages,
          pricing: regionItemPrices,
        })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions))
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);
    }

    // Get total count
    let total = 0;
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const whereCondition = sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`;
      const [{ count: searchCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions))
        .where(whereCondition);
      total = Number(searchCount);
    } else {
      const [{ count: combinedCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...shapeJoinConditions))
        .innerJoin(regionItemPrices, and(...regionJoinConditions));
      total = Number(combinedCount);
    }

    // Group by flavor and include images and pricing
    const groupedFlavors = new Map<string, FlavorWithVariantImagesDto>();
    allFlavorsResult.forEach((row) => {
      const flavorId = row.flavor.id;
      if (!groupedFlavors.has(flavorId)) {
        groupedFlavors.set(flavorId, {
          ...this.mapToFlavorResponse(row.flavor),
          variantImages: [],
          price: row.pricing.price,
        });
      }
      const flavorEntry = groupedFlavors.get(flavorId);
      if (flavorEntry && flavorEntry.variantImages) {
        flavorEntry.variantImages.push({
          id: row.image.id,
          slicedViewUrl: row.image.slicedViewUrl,
          frontViewUrl: row.image.frontViewUrl,
          topViewUrl: row.image.topViewUrl,
          createdAt: row.image.createdAt,
          updatedAt: row.image.updatedAt,
        });
      }
    });

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: Array.from(groupedFlavors.values()),
      total,
      totalPages,
    };
  }

  /**
   * Find flavors by shapeId (returns variant images)
   */
  private async findFlavorsByShape(
    query: GetFlavorsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: FlavorWithVariantImagesDto[];
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
      eq(shapeVariantImages.flavorId, flavors.id),
      eq(shapeVariantImages.shapeId, query.shapeId),
    ] as const;

    let allFlavorsResult: Array<{
      flavor: typeof flavors.$inferSelect;
      image: typeof shapeVariantImages.$inferSelect;
    }> = [];
    let total = 0;

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const whereCondition = sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`;

      allFlavorsResult = await db
        .select({
          flavor: flavors,
          image: shapeVariantImages,
        })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...joinConditions))
        .where(whereCondition)
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);

      const [{ count: searchCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...joinConditions))
        .where(whereCondition);
      total = Number(searchCount);
    } else {
      allFlavorsResult = await db
        .select({
          flavor: flavors,
          image: shapeVariantImages,
        })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...joinConditions))
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);

      const [{ count: shapeCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
        .from(flavors)
        .innerJoin(shapeVariantImages, and(...joinConditions));
      total = Number(shapeCount);
    }

    // Group by flavor and include images
    const groupedFlavors = new Map<string, FlavorWithVariantImagesDto>();
    allFlavorsResult.forEach((row) => {
      const flavorId = row.flavor.id;
      if (!groupedFlavors.has(flavorId)) {
        groupedFlavors.set(flavorId, {
          ...this.mapToFlavorResponse(row.flavor),
          variantImages: [],
        });
      }
      const flavorEntry = groupedFlavors.get(flavorId);
      if (flavorEntry && flavorEntry.variantImages) {
        flavorEntry.variantImages.push({
          id: row.image.id,
          slicedViewUrl: row.image.slicedViewUrl,
          frontViewUrl: row.image.frontViewUrl,
          topViewUrl: row.image.topViewUrl,
          createdAt: row.image.createdAt,
          updatedAt: row.image.updatedAt,
        });
      }
    });

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: Array.from(groupedFlavors.values()),
      total,
      totalPages,
    };
  }

  /**
   * Find flavors by regionId (returns pricing)
   */
  private async findFlavorsByRegion(
    query: GetFlavorsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: FlavorDataDto[];
    total: number;
    totalPages: number;
  }> {
    const joinConditions = [
      eq(regionItemPrices.flavorId, flavors.id),
      eq(regionItemPrices.regionId, query.regionId),
    ] as const;

    let allFlavorsResult: Array<{
      flavor: typeof flavors.$inferSelect;
      pricing: typeof regionItemPrices.$inferSelect;
    }> = [];
    let total = 0;

    // If search is also provided, combine both filters
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      const whereCondition = sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`;

      const [{ count: combinedCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
        .from(flavors)
        .innerJoin(regionItemPrices, and(...joinConditions))
        .where(whereCondition);

      total = Number(combinedCount);

      allFlavorsResult = await db
        .select({
          flavor: flavors,
          pricing: regionItemPrices,
        })
        .from(flavors)
        .innerJoin(regionItemPrices, and(...joinConditions))
        .where(whereCondition)
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);
    } else {
      // Only regionId, no tagId or search
      const [{ count: regionCount }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
        .from(flavors)
        .innerJoin(regionItemPrices, and(...joinConditions));

      total = Number(regionCount);

      allFlavorsResult = await db
        .select({
          flavor: flavors,
          pricing: regionItemPrices,
        })
        .from(flavors)
        .innerJoin(regionItemPrices, and(...joinConditions))
        .orderBy(sortOrder(sortColumn))
        .limit(query.limit)
        .offset(offset);
    }

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: allFlavorsResult.map((row) => ({
        ...this.mapToFlavorResponse(row.flavor),
        price: row.pricing.price,
      })),
      total,
      totalPages,
    };
  }

  /**
   * Find flavors by search
   */
  private async findFlavorsBySearch(
    query: GetFlavorsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: FlavorDataDto[];
    total: number;
    totalPages: number;
  }> {
    const searchPattern = `%${query.search}%`;
    const [{ count: searchCount }] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
      .from(flavors)
      .where(sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`);

    const total = Number(searchCount);

    const allFlavorsResult = await db
      .select({
        flavor: flavors,
      })
      .from(flavors)
      .where(sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`)
      .orderBy(sortOrder(sortColumn))
      .limit(query.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: allFlavorsResult.map((row) => this.mapToFlavorResponse(row.flavor)),
      total,
      totalPages,
    };
  }

  /**
   * Get all flavors with pagination
   */
  private async getAllFlavors(
    query: GetFlavorsQueryDto,
    offset: number,
    sortOrder: any,
    sortColumn: any,
  ): Promise<{
    items: FlavorDataDto[];
    total: number;
    totalPages: number;
  }> {
    const [{ count: allCount }] = await db.select({ count: sql<number>`COUNT(*)` }).from(flavors);

    const total = Number(allCount);

    const allFlavorsResult = await db
      .select({
        flavor: flavors,
      })
      .from(flavors)
      .orderBy(sortOrder(sortColumn))
      .limit(query.limit)
      .offset(offset);

    const totalPages = Math.ceil(total / query.limit);

    return {
      items: allFlavorsResult.map((row) => this.mapToFlavorResponse(row.flavor)),
      total,
      totalPages,
    };
  }

  /**
   * Get all flavors with optional filtering and pagination
   *
   * Supports the following filter combinations:
   * - shapeId + regionId (with optional search) - returns variant images + pricing
   * - shapeId only (with optional search) - returns variant images
   * - regionId only (with optional search) - returns pricing
   * - search only - searches by flavor title
   * - no filters - returns all flavors
   *
   * Note: Search can be combined with any filter
   */
  async findAll(query: GetFlavorsQueryDto): Promise<
    SuccessResponse<
      | FlavorDataDto[]
      | FlavorWithVariantImagesDto[]
      | {
          items: FlavorWithVariantImagesDto[];
          pagination: { total: number; totalPages: number; page: number; limit: number };
        }
      | {
          items: FlavorDataDto[];
          pagination: { total: number; totalPages: number; page: number; limit: number };
        }
    >
  > {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn = query.sortBy === FlavorSortBy.TITLE ? flavors.title : flavors.createdAt;

      let result: { items: any[]; total: number; totalPages: number };

      // Route to appropriate filter handler - each handler already supports search
      if (query.shapeId && query.regionId) {
        result = await this.findFlavorsByShapeAndRegion(query, offset, sortOrder, sortColumn);
      } else if (query.shapeId) {
        result = await this.findFlavorsByShape(query, offset, sortOrder, sortColumn);
      } else if (query.regionId) {
        result = await this.findFlavorsByRegion(query, offset, sortOrder, sortColumn);
      } else if (query.search) {
        result = await this.findFlavorsBySearch(query, offset, sortOrder, sortColumn);
      } else {
        result = await this.getAllFlavors(query, offset, sortOrder, sortColumn);
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
        'Flavors retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve flavors: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve flavors',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<FlavorDataDto>> {
    try {
      const [item] = await db
        .select({
          flavor: flavors,
        })
        .from(flavors)
        .where(eq(flavors.id, id))
        .limit(1);

      if (!item) {
        this.logger.warn(`Flavor not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Flavor not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      return successResponse(
        this.mapToFlavorResponse(item.flavor),
        'Flavor retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve flavor ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve flavor',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(id: string, updateDto: UpdateFlavorDto): Promise<SuccessResponse<FlavorDataDto>> {
    try {
      // Check if flavor exists
      const existingFlavor = await db
        .select({ id: flavors.id })
        .from(flavors)
        .where(eq(flavors.id, id))
        .limit(1);

      if (!existingFlavor.length) {
        throw new NotFoundException(
          errorResponse('Flavor not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const updateFields: Record<string, string> = {};
      if (updateDto.title !== undefined) updateFields.title = updateDto.title;
      if (updateDto.description !== undefined) updateFields.description = updateDto.description;
      if (updateDto.flavorUrl !== undefined) updateFields.flavorUrl = updateDto.flavorUrl;

      const [updatedFlavor] = await db
        .update(flavors)
        .set(updateFields)
        .where(eq(flavors.id, id))
        .returning();

      this.logger.log(`Flavor updated: ${id}`);
      return successResponse(
        this.mapToFlavorResponse(updatedFlavor),
        'Flavor updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update flavor ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update flavor',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<null>> {
    try {
      const existingFlavor = await db
        .select({ id: flavors.id })
        .from(flavors)
        .where(eq(flavors.id, id))
        .limit(1);

      if (!existingFlavor.length) {
        throw new NotFoundException(
          errorResponse('Flavor not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(flavors).where(eq(flavors.id, id));

      this.logger.log(`Flavor deleted: ${id}`);
      return successResponse(null, 'Flavor deleted successfully', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete flavor ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete flavor',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async createRegionItemPrice(
    createDto: CreateFlavorRegionItemPriceDto,
  ): Promise<SuccessResponse<typeof regionItemPrices.$inferSelect>> {
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

      const flavorExists = await db
        .select({ id: flavors.id })
        .from(flavors)
        .where(eq(flavors.id, createDto.flavorId))
        .limit(1);

      if (!flavorExists.length) {
        throw new BadRequestException(
          errorResponse('Flavor not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      // Check if pricing already exists for this region and flavor
      const existingPrice: { id: string }[] = await db
        .select({ id: regionItemPrices.id })
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.flavorId, createDto.flavorId),
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
        this.logger.log(`Flavor region price updated: ${result.id}`);
        return successResponse(result, 'Flavor region price updated successfully', HttpStatus.OK);
      } else {
        // Create new pricing
        const insertResult = await db
          .insert(regionItemPrices)
          .values({
            regionId: createDto.regionId,
            flavorId: createDto.flavorId,
            price: String(createDto.price),
            addonId: null,
            featuredCakeId: null,
            sweetId: null,
            decorationId: null,
            shapeId: null,
          })
          .returning();

        result = insertResult[0];
        this.logger.log(`Flavor region price created: ${result.id}`);
        return successResponse(
          result,
          'Flavor region price created successfully',
          HttpStatus.CREATED,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create flavor region price: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create flavor region price',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async createWithVariantImages(
    createDto: CreateFlavorWithVariantImagesDto,
  ): Promise<SuccessResponse<FlavorDataDto>> {
    try {
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

      // Create flavor
      const [newFlavor] = await db
        .insert(flavors)
        .values({
          title: createDto.title,
          description: createDto.description,
          flavorUrl: createDto.flavorUrl,
        })
        .returning();

      if (createDto.variantImages && createDto.variantImages.length > 0) {
        await db.insert(shapeVariantImages).values(
          createDto.variantImages.map((variant) => ({
            shapeId: variant.shapeId,
            flavorId: newFlavor.id,
            decorationId: null,
            slicedViewUrl: variant.slicedViewUrl,
            frontViewUrl: variant.frontViewUrl,
            topViewUrl: variant.topViewUrl,
          })),
        );
      }

      this.logger.log(
        `Flavor with variant images created: ${newFlavor.id} with ${createDto.variantImages?.length || 0} variants`,
      );
      return successResponse(
        this.mapToFlavorResponse(newFlavor),
        'Flavor and variant images created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Flavor creation with variant images error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create flavor with variant images',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
