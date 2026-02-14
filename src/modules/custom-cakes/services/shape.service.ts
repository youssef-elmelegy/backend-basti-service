import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateShapeDto,
  UpdateShapeDto,
  GetShapesQueryDto,
  ShapeDataDto,
  CreateShapeRegionItemPriceDto,
  ShapeSortBy,
} from '../dto';
import { db } from '@/db';
import { shapes, regionItemPrices, regions } from '@/db/schema';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class ShapeService {
  private readonly logger = new Logger(ShapeService.name);

  /**
   * Map shape data to response DTO
   */
  private mapToShapeResponse(shape: typeof shapes.$inferSelect): ShapeDataDto {
    return {
      id: shape.id,
      title: shape.title,
      description: shape.description,
      shapeUrl: shape.shapeUrl,
      createdAt: shape.createdAt,
      updatedAt: shape.updatedAt,
    };
  }

  async create(createDto: CreateShapeDto): Promise<SuccessResponse<ShapeDataDto>> {
    try {
      const [newShape] = await db
        .insert(shapes)
        .values({
          title: createDto.title,
          description: createDto.description,
          shapeUrl: createDto.shapeUrl,
        })
        .returning();

      this.logger.log(`Shape created: ${newShape.id}`);
      return successResponse(
        this.mapToShapeResponse(newShape),
        'Shape created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Shape creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create shape',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(query: GetShapesQueryDto): Promise<
    SuccessResponse<{
      items: ShapeDataDto[];
      pagination: { total: number; totalPages: number; page: number; limit: number };
    }>
  > {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn = query.sortBy === ShapeSortBy.TITLE ? shapes.title : shapes.createdAt;

      let allShapesResult: Array<{
        shape: typeof shapes.$inferSelect;
      }> = [];
      let total = 0;

      // Filter by regionId
      if (query.regionId) {
        const joinConditions = [
          eq(regionItemPrices.shapeId, shapes.id),
          eq(regionItemPrices.regionId, query.regionId),
        ] as const;

        // If search is also provided, combine both filters
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          const whereCondition = sql`LOWER(${shapes.title}) LIKE LOWER(${searchPattern})`;

          const [{ count: combinedCount }] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${shapes.id})` })
            .from(shapes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .where(whereCondition);

          total = Number(combinedCount);

          allShapesResult = await db
            .select({
              shape: shapes,
            })
            .from(shapes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .where(whereCondition)
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        } else {
          // Only regionId, no search
          const [{ count: regionCount }] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${shapes.id})` })
            .from(shapes)
            .innerJoin(regionItemPrices, and(...joinConditions));

          total = Number(regionCount);

          allShapesResult = await db
            .select({
              shape: shapes,
            })
            .from(shapes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        }
      }
      // Search by title if provided
      else if (query.search) {
        const searchPattern = `%${query.search}%`;
        const [{ count: searchCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${shapes.id})` })
          .from(shapes)
          .where(sql`LOWER(${shapes.title}) LIKE LOWER(${searchPattern})`);

        total = Number(searchCount);

        allShapesResult = await db
          .select({
            shape: shapes,
          })
          .from(shapes)
          .where(sql`LOWER(${shapes.title}) LIKE LOWER(${searchPattern})`)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      }
      // Get all shapes
      else {
        const [{ count: allCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(shapes);

        total = Number(allCount);

        allShapesResult = await db
          .select({
            shape: shapes,
          })
          .from(shapes)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      }

      const totalPages = Math.ceil(total / query.limit);

      return successResponse(
        {
          items: allShapesResult.map((row) => this.mapToShapeResponse(row.shape)),
          pagination: {
            total,
            totalPages,
            page: query.page,
            limit: query.limit,
          },
        },
        'Shapes retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve shapes: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve shapes',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<ShapeDataDto>> {
    try {
      const [item] = await db
        .select({
          shape: shapes,
        })
        .from(shapes)
        .where(eq(shapes.id, id))
        .limit(1);

      if (!item) {
        this.logger.warn(`Shape not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Shape not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      return successResponse(
        this.mapToShapeResponse(item.shape),
        'Shape retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve shape ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve shape',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(id: string, updateDto: UpdateShapeDto): Promise<SuccessResponse<ShapeDataDto>> {
    try {
      // Check if shape exists
      const existingShape = await db
        .select({ id: shapes.id })
        .from(shapes)
        .where(eq(shapes.id, id))
        .limit(1);

      if (!existingShape.length) {
        throw new NotFoundException(
          errorResponse('Shape not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      // Update only provided fields
      const updateData = Object.fromEntries(
        Object.entries(updateDto).filter(([, value]) => value !== undefined),
      );

      const [updatedShape] = await db
        .update(shapes)
        .set(updateData)
        .where(eq(shapes.id, id))
        .returning();

      this.logger.log(`Shape updated: ${id}`);
      return successResponse(
        this.mapToShapeResponse(updatedShape),
        'Shape updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update shape ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update shape',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<null>> {
    try {
      const existingShape = await db
        .select({ id: shapes.id })
        .from(shapes)
        .where(eq(shapes.id, id))
        .limit(1);

      if (!existingShape.length) {
        throw new NotFoundException(
          errorResponse('Shape not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(shapes).where(eq(shapes.id, id));

      this.logger.log(`Shape deleted: ${id}`);
      return successResponse(null, 'Shape deleted successfully', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete shape ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete shape',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async createRegionItemPrice(
    createDto: CreateShapeRegionItemPriceDto,
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

      // Validate shape exists
      const shapeExists = await db
        .select({ id: shapes.id })
        .from(shapes)
        .where(eq(shapes.id, createDto.shapeId))
        .limit(1);

      if (!shapeExists.length) {
        throw new BadRequestException(
          errorResponse('Shape not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      // Check if pricing already exists for this region and shape
      const existingPrice: { id: string }[] = await db
        .select({ id: regionItemPrices.id })
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.shapeId, createDto.shapeId),
            eq(regionItemPrices.regionId, createDto.regionId),
          ),
        )
        .limit(1);

      let result: any;
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.log(`Shape region price updated: ${result.id}`);
        return successResponse(result, 'Shape region price updated successfully', HttpStatus.OK);
      } else {
        // Create new pricing
        const insertResult = await db
          .insert(regionItemPrices)
          .values({
            regionId: createDto.regionId,
            shapeId: createDto.shapeId,
            price: String(createDto.price),
            addonId: null,
            featuredCakeId: null,
            sweetId: null,
            decorationId: null,
            flavorId: null,
          })
          .returning();

        result = insertResult[0];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.log(`Shape region price created: ${result.id}`);
        return successResponse(
          result,
          'Shape region price created successfully',
          HttpStatus.CREATED,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create shape region price: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create shape region price',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
