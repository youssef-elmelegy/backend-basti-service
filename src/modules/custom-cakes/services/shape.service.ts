import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
import {
  shapes,
  regionItemPrices,
  regions,
  shapeVariantImages,
  designedCakeConfigs,
} from '@/db/schema';
import { eq, desc, asc, sql, and, inArray } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class ShapeService {
  private readonly logger = new Logger(ShapeService.name);

  /**
   * Map shape data to response DTO
   */
  private mapToShapeResponse(shape: typeof shapes.$inferSelect, price?: string): ShapeDataDto {
    const response: ShapeDataDto = {
      id: shape.id,
      title: shape.title,
      description: shape.description,
      shapeUrl: shape.shapeUrl,
      size: shape.size,
      capacity: shape.capacity,
      createdAt: shape.createdAt,
      updatedAt: shape.updatedAt,
    };

    if (price) {
      response.price = price;
    }

    return response;
  }

  async create(createDto: CreateShapeDto): Promise<SuccessResponse<ShapeDataDto>> {
    try {
      const [newShape] = await db
        .insert(shapes)
        .values({
          title: createDto.title,
          description: createDto.description,
          shapeUrl: createDto.shapeUrl,
          size: createDto.size,
          capacity: createDto.capacity,
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

  async findAll(query: GetShapesQueryDto): Promise<SuccessResponse<ShapeDataDto[]>> {
    try {
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn = query.sortBy === ShapeSortBy.TITLE ? shapes.title : shapes.createdAt;

      const whereConditions: any[] = [];
      if (query.isActive !== undefined) {
        whereConditions.push(eq(shapes.isActive, query.isActive));
      }

      let allShapesResult: Array<{
        shape: typeof shapes.$inferSelect;
        price?: string;
      }> = [];

      // Filter by regionId
      if (query.regionId) {
        const joinConditions = [
          eq(regionItemPrices.shapeId, shapes.id),
          eq(regionItemPrices.regionId, query.regionId),
        ] as const;

        // If search is also provided, combine both filters
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          const searchCondition = sql`LOWER(${shapes.title}) LIKE LOWER(${searchPattern})`;
          whereConditions.push(searchCondition);

          allShapesResult = await db
            .select({
              shape: shapes,
              price: regionItemPrices.price,
            })
            .from(shapes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(sortOrder(sortColumn));
        } else {
          // Only regionId, no search
          allShapesResult = await db
            .select({
              shape: shapes,
              price: regionItemPrices.price,
            })
            .from(shapes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(sortOrder(sortColumn));
        }
      }
      // Search by title if provided
      else if (query.search) {
        const searchPattern = `%${query.search}%`;
        whereConditions.push(sql`LOWER(${shapes.title}) LIKE LOWER(${searchPattern})`);

        allShapesResult = await db
          .select({
            shape: shapes,
          })
          .from(shapes)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sortOrder(sortColumn));
      }
      // Get all shapes
      else {
        allShapesResult = await db
          .select({
            shape: shapes,
          })
          .from(shapes)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sortOrder(sortColumn));
      }

      return successResponse(
        allShapesResult.map((row) => this.mapToShapeResponse(row.shape, row.price || undefined)),
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

      // Check if any predesigned cake config uses this shape
      const relatedConfigs = await db
        .select({
          configId: designedCakeConfigs.id,
          predesignedCakeId: designedCakeConfigs.predesignedCakeId,
        })
        .from(designedCakeConfigs)
        .where(eq(designedCakeConfigs.shapeId, id));

      if (relatedConfigs.length > 0) {
        const uniquePredesignedCakeIds = [
          ...new Set(relatedConfigs.map((c) => c.predesignedCakeId)),
        ];
        throw new ConflictException({
          ...errorResponse(
            'Cannot delete shape because it is used in predesigned cake configurations',
            HttpStatus.CONFLICT,
            'ConflictException',
          ),
          relatedConfigsCount: relatedConfigs.length,
          affectedPredesignedCakesCount: uniquePredesignedCakeIds.length,
          affectedPredesignedCakeIds: uniquePredesignedCakeIds,
        });
      }

      // Delete related variant images first
      await db.delete(shapeVariantImages).where(eq(shapeVariantImages.shapeId, id));

      await db.delete(shapes).where(eq(shapes.id, id));

      this.logger.log(`Shape deleted: ${id}`);
      return successResponse(null, 'Shape deleted successfully', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
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

  /**
   * Force-delete a shape along with all its predesigned cake configs.
   * Use this after the regular DELETE returns a 409 Conflict.
   */
  async forceDelete(id: string): Promise<SuccessResponse<null>> {
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

      // Collect all related configs
      const relatedConfigs = await db
        .select({
          configId: designedCakeConfigs.id,
          predesignedCakeId: designedCakeConfigs.predesignedCakeId,
        })
        .from(designedCakeConfigs)
        .where(eq(designedCakeConfigs.shapeId, id));

      // Delete configs that use this shape (DB restrict prevents cascade)
      if (relatedConfigs.length > 0) {
        const configIds = relatedConfigs.map((c) => c.configId);
        await db.delete(designedCakeConfigs).where(inArray(designedCakeConfigs.id, configIds));
        this.logger.log(`Deleted ${configIds.length} designed cake configs for shape ${id}`);
      }

      // Delete variant images then the shape itself
      await db.delete(shapeVariantImages).where(eq(shapeVariantImages.shapeId, id));
      await db.delete(shapes).where(eq(shapes.id, id));

      this.logger.log(`Force-deleted shape ${id}`);
      return successResponse(null, 'Shape and related records deleted successfully', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to force-delete shape ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to force-delete shape',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async toggleStatus(id: string): Promise<SuccessResponse<Record<string, unknown>>> {
    try {
      const [existingShape] = await db.select().from(shapes).where(eq(shapes.id, id)).limit(1);

      if (!existingShape) {
        this.logger.warn(`Shape not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('Shape not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [updatedShape] = await db
        .update(shapes)
        .set({
          isActive: !existingShape.isActive,
          updatedAt: new Date(),
        })
        .where(eq(shapes.id, id))
        .returning();

      const statusText = updatedShape.isActive ? 'activated' : 'deactivated';
      this.logger.log(`Shape status toggled (${statusText}): ${id}`);

      return successResponse(
        {
          id: updatedShape.id,
          title: updatedShape.title,
          description: updatedShape.description,
          shapeUrl: updatedShape.shapeUrl,
          size: updatedShape.size,
          isActive: updatedShape.isActive,
          createdAt: updatedShape.createdAt,
          updatedAt: updatedShape.updatedAt,
        },
        `Shape status ${statusText} successfully`,
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to toggle shape status ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to toggle shape status',
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
