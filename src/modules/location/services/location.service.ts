import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '@/db';
import { locations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationDataDto,
  DeleteLocationResponseDto,
} from '../dto';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  async create(
    userId: string,
    createDto: CreateLocationDto,
  ): Promise<SuccessResponse<LocationDataDto>> {
    try {
      const [newLocation] = await db
        .insert(locations)
        .values({
          userId,
          label: createDto.label,
          latitude: String(createDto.latitude),
          longitude: String(createDto.longitude),
          buildingNo: createDto.buildingNo,
          street: createDto.street,
          description: createDto.description,
        })
        .returning();

      this.logger.log(`Location created: ${newLocation.id} for user: ${userId}`);

      return successResponse(
        this.mapToLocationResponse(newLocation),
        'Location created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Location creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create location',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(userId: string): Promise<SuccessResponse<LocationDataDto[]>> {
    try {
      const userLocations = await db
        .select()
        .from(locations)
        .where(eq(locations.userId, userId))
        .orderBy(locations.createdAt);

      this.logger.debug(`Retrieved ${userLocations.length} locations for user: ${userId}`);

      return successResponse(
        userLocations.map((loc) => this.mapToLocationResponse(loc)),
        'Locations retrieved successfully',
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve locations: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve locations',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string, userId: string): Promise<SuccessResponse<LocationDataDto>> {
    try {
      const location = await this.findLocationOrFail(id, userId);

      this.logger.debug(`Retrieved location: ${id}`);

      return successResponse(
        this.mapToLocationResponse(location),
        'Location retrieved successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve location: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve location',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateLocationDto,
  ): Promise<SuccessResponse<LocationDataDto>> {
    try {
      await this.findLocationOrFail(id, userId);

      const [updated] = await db
        .update(locations)
        .set({
          ...(updateDto.label !== undefined && { label: updateDto.label }),
          ...(updateDto.latitude !== undefined && { latitude: String(updateDto.latitude) }),
          ...(updateDto.longitude !== undefined && { longitude: String(updateDto.longitude) }),
          ...(updateDto.buildingNo !== undefined && { buildingNo: updateDto.buildingNo }),
          ...(updateDto.street !== undefined && { street: updateDto.street }),
          ...(updateDto.description !== undefined && { description: updateDto.description }),
          updatedAt: new Date(),
        })
        .where(and(eq(locations.id, id), eq(locations.userId, userId)))
        .returning();

      this.logger.log(`Location updated: ${id}`);

      return successResponse(this.mapToLocationResponse(updated), 'Location updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update location: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update location',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string, userId: string): Promise<SuccessResponse<DeleteLocationResponseDto>> {
    try {
      await this.findLocationOrFail(id, userId);

      await db.delete(locations).where(and(eq(locations.id, id), eq(locations.userId, userId)));

      this.logger.log(`Location deleted: ${id}`);

      return successResponse(
        { message: 'Location deleted successfully' },
        'Location deleted successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete location: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete location',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async findLocationOrFail(id: string, userId: string) {
    const [location] = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, id), eq(locations.userId, userId)))
      .limit(1);

    if (!location) {
      throw new NotFoundException(
        errorResponse(
          `Location with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
      );
    }

    return location;
  }

  private mapToLocationResponse(location: typeof locations.$inferSelect): LocationDataDto {
    return {
      id: location.id,
      label: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
      buildingNo: location.buildingNo,
      street: location.street,
      description: location.description,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }
}
