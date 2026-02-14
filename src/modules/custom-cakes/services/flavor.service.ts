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
} from '../dto';
import { db } from '@/db';
import { flavors, regionItemPrices, regions } from '@/db/schema';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
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

  async findAll(query: GetFlavorsQueryDto): Promise<
    SuccessResponse<{
      items: FlavorDataDto[];
      pagination: { total: number; totalPages: number; page: number; limit: number };
    }>
  > {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn = query.sortBy === FlavorSortBy.TITLE ? flavors.title : flavors.createdAt;

      let allFlavorsResult: Array<{
        flavor: typeof flavors.$inferSelect;
      }> = [];
      let total = 0;

      if (query.regionId) {
        const joinConditions = [
          eq(regionItemPrices.flavorId, flavors.id),
          eq(regionItemPrices.regionId, query.regionId),
        ] as const;

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
            })
            .from(flavors)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .where(whereCondition)
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        } else {
          // Only regionId, no search
          const [{ count: regionCount }] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
            .from(flavors)
            .innerJoin(regionItemPrices, and(...joinConditions));

          total = Number(regionCount);

          allFlavorsResult = await db
            .select({
              flavor: flavors,
            })
            .from(flavors)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        }
      } else if (query.search) {
        const searchPattern = `%${query.search}%`;
        const [{ count: searchCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${flavors.id})` })
          .from(flavors)
          .where(sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`);

        total = Number(searchCount);

        allFlavorsResult = await db
          .select({
            flavor: flavors,
          })
          .from(flavors)
          .where(sql`LOWER(${flavors.title}) LIKE LOWER(${searchPattern})`)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      } else {
        const [{ count: allCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(flavors);

        total = Number(allCount);

        allFlavorsResult = await db
          .select({
            flavor: flavors,
          })
          .from(flavors)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      }

      const totalPages = Math.ceil(total / query.limit);

      return successResponse(
        {
          items: allFlavorsResult.map((row) => this.mapToFlavorResponse(row.flavor)),
          pagination: {
            total,
            totalPages,
            page: query.page,
            limit: query.limit,
          },
        },
        'Flavors retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
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

      const updateData = Object.fromEntries(
        Object.entries(updateDto).filter(([, value]) => value !== undefined),
      );

      const [updatedFlavor] = await db
        .update(flavors)
        .set(updateData)
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
}
