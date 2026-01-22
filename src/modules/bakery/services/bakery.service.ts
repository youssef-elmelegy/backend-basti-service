import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { bakeries, regions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CreateBakeryDto, UpdateBakeryDto, BakeryResponse } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class BakeryService {
  private readonly logger = new Logger(BakeryService.name);

  async create(createBakeryDto: CreateBakeryDto): Promise<SuccessResponse<BakeryResponse>> {
    const { name, locationDescription, regionId, capacity, bakeryTypes } = createBakeryDto;

    // Validate region exists
    const existingRegion = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);

    if (existingRegion.length === 0) {
      this.logger.warn(`Bakery creation failed: Invalid region ID`);
      throw new BadRequestException(
        errorResponse('Region ID is invalid', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    try {
      const [newBakery] = await db
        .insert(bakeries)
        .values({
          name,
          locationDescription,
          regionId,
          capacity,
          bakeryTypes: bakeryTypes as (
            | 'basket_cakes'
            | 'medium_cakes'
            | 'small_cakes'
            | 'large_cakes'
            | 'custom'
          )[],
        })
        .returning();

      this.logger.log(`Bakery created: ${newBakery.id} (${name})`);

      return successResponse(
        this.formatBakeryResponse(newBakery),
        'Bakery created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bakery creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(): Promise<SuccessResponse<BakeryResponse[]>> {
    try {
      const allBakeries = await db.select().from(bakeries);

      const formattedBakeries = allBakeries.map((bakery) => this.formatBakeryResponse(bakery));

      this.logger.debug(`Retrieved ${allBakeries.length} bakeries`);

      return successResponse(formattedBakeries, 'Bakeries retrieved successfully', HttpStatus.OK);
    } catch {
      this.logger.error('Failed to retrieve bakeries');
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve bakeries',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<BakeryResponse>> {
    const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, id)).limit(1);

    if (!bakery) {
      this.logger.warn(`Bakery not found: ${id}`);
      throw new NotFoundException(
        errorResponse('Bakery not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Bakery retrieved: ${id}`);

    return successResponse(
      this.formatBakeryResponse(bakery),
      'Bakery retrieved successfully',
      HttpStatus.OK,
    );
  }

  async update(
    id: string,
    updateBakeryDto: UpdateBakeryDto,
  ): Promise<SuccessResponse<BakeryResponse>> {
    const { name, locationDescription, regionId, capacity, bakeryTypes } = updateBakeryDto;

    const [existingBakery] = await db.select().from(bakeries).where(eq(bakeries.id, id)).limit(1);

    if (!existingBakery) {
      this.logger.warn(`Bakery update failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Bakery not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Validate region if provided
    if (regionId) {
      const existingRegion = await db
        .select()
        .from(regions)
        .where(eq(regions.id, regionId))
        .limit(1);

      if (existingRegion.length === 0) {
        this.logger.warn(`Bakery update failed: Invalid region ID`);
        throw new BadRequestException(
          errorResponse('Region ID is invalid', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }
    }

    try {
      const updateData: Record<string, string | number | Date | Array<string>> = {};
      if (name !== undefined) updateData.name = name;
      if (locationDescription !== undefined) updateData.locationDescription = locationDescription;
      if (regionId !== undefined) updateData.regionId = regionId;
      if (capacity !== undefined) updateData.capacity = capacity;
      if (bakeryTypes !== undefined)
        updateData.bakeryTypes = bakeryTypes as (
          | 'basket_cakes'
          | 'medium_cakes'
          | 'small_cakes'
          | 'large_cakes'
          | 'custom'
        )[];
      updateData.updatedAt = new Date();

      const [updatedBakery] = await db
        .update(bakeries)

        .set(updateData)
        .where(eq(bakeries.id, id))
        .returning();

      this.logger.log(`Bakery updated: ${id}`);

      return successResponse(
        this.formatBakeryResponse(updatedBakery),
        'Bakery updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bakery update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    const [existingBakery] = await db.select().from(bakeries).where(eq(bakeries.id, id)).limit(1);

    if (!existingBakery) {
      this.logger.warn(`Bakery deletion failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Bakery not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    try {
      await db.delete(bakeries).where(eq(bakeries.id, id));

      this.logger.log(`Bakery deleted: ${id}`);

      return successResponse(
        { message: 'Bakery deleted successfully' },
        'Bakery deleted successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Bakery deletion error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private formatBakeryResponse(bakery: {
    id: string;
    regionId: string;
    name: string;
    locationDescription: string;
    capacity: number;
    bakeryTypes: Array<string>;
    averageRating?: string;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
  }): BakeryResponse {
    return {
      id: bakery.id,
      name: bakery.name,
      locationDescription: bakery.locationDescription,
      capacity: bakery.capacity,
      regionId: bakery.regionId,
      types: bakery.bakeryTypes,
      averageRating: bakery.averageRating ? parseFloat(bakery.averageRating) : null,
      totalReviews: bakery.totalReviews,
      createdAt: bakery.createdAt,
      updatedAt: bakery.updatedAt,
    };
  }
}
