import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { regions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CreateRegionDto, UpdateRegionDto, RegionResponse } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);

  async create(createRegionDto: CreateRegionDto): Promise<SuccessResponse<RegionResponse>> {
    const { name } = createRegionDto;

    const existingRegion = await db.select().from(regions).where(eq(regions.name, name)).limit(1);

    if (existingRegion.length > 0) {
      this.logger.warn(`Region creation failed: Name already exists - ${name}`);
      throw new ConflictException(
        errorResponse(
          'Region with this name already exists',
          HttpStatus.CONFLICT,
          'ConflictException',
        ),
      );
    }

    try {
      const [newRegion] = await db.insert(regions).values({ name }).returning();

      this.logger.log(`Region created: ${newRegion.id} (${name})`);

      return successResponse(
        {
          id: newRegion.id,
          name: newRegion.name,
          createdAt: newRegion.createdAt,
          updatedAt: newRegion.updatedAt,
        },
        'Region created successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Region creation error for ${name}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create region',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(): Promise<SuccessResponse<RegionResponse[]>> {
    try {
      const allRegions = await db.select().from(regions);

      this.logger.debug(`Retrieved ${allRegions.length} regions`);

      return successResponse(
        allRegions.map((region) => ({
          id: region.id,
          name: region.name,
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
        })),
        'Regions retrieved successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error('Failed to retrieve regions');
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve regions',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<RegionResponse>> {
    const [region] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);

    if (!region) {
      this.logger.warn(`Region not found: ${id}`);
      throw new NotFoundException(
        errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Region retrieved: ${id}`);

    return successResponse(
      {
        id: region.id,
        name: region.name,
        createdAt: region.createdAt,
        updatedAt: region.updatedAt,
      },
      'Region retrieved successfully',
      HttpStatus.OK,
    );
  }

  async update(
    id: string,
    updateRegionDto: UpdateRegionDto,
  ): Promise<SuccessResponse<RegionResponse>> {
    const { name } = updateRegionDto;

    const [existingRegion] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);

    if (!existingRegion) {
      this.logger.warn(`Region update failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (name) {
      const [duplicateRegion] = await db
        .select()
        .from(regions)
        .where(eq(regions.name, name))
        .limit(1);

      if (duplicateRegion && duplicateRegion.id !== id) {
        this.logger.warn(`Region update failed: Name already exists - ${name}`);
        throw new ConflictException(
          errorResponse(
            'Region with this name already exists',
            HttpStatus.CONFLICT,
            'ConflictException',
          ),
        );
      }
    }

    try {
      const [updatedRegion] = await db
        .update(regions)
        .set({
          ...(name && { name }),
          updatedAt: new Date(),
        })
        .where(eq(regions.id, id))
        .returning();

      this.logger.log(`Region updated: ${id}`);

      return successResponse(
        {
          id: updatedRegion.id,
          name: updatedRegion.name,
          createdAt: updatedRegion.createdAt,
          updatedAt: updatedRegion.updatedAt,
        },
        'Region updated successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Region update error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update region',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    const [existingRegion] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);

    if (!existingRegion) {
      this.logger.warn(`Region deletion failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('Region not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    try {
      await db.delete(regions).where(eq(regions.id, id));

      this.logger.log(`Region deleted: ${id}`);

      return successResponse(
        { message: 'Region deleted successfully' },
        'Region deleted successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Region deletion error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete region',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
