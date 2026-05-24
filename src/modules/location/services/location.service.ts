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
          area: createDto.area,
          apartmentNo: createDto.apartmentNo,
          officeNo: createDto.officeNo,
          floor: createDto.floor,
          additionalInfo: createDto.additionalInfo,
          type: createDto.type,
          description: createDto.description,
        })
        .returning();

      this.logger.log(`Location created: ${newLocation.id} for user: ${userId}`);

      return successResponse(
        this.mapToLocationResponse(newLocation),
        'routes.locations.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Location creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.locations.failed_create',
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
        'routes.locations.list_retrieved',
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve locations: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.locations.failed_list',
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

      return successResponse(this.mapToLocationResponse(location), 'routes.locations.retrieved');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve location: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.locations.failed_retrieve',
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
          ...(updateDto.area !== undefined && { area: updateDto.area }),
          ...(updateDto.apartmentNo !== undefined && { apartmentNo: updateDto.apartmentNo }),
          ...(updateDto.officeNo !== undefined && { officeNo: updateDto.officeNo }),
          ...(updateDto.floor !== undefined && { floor: updateDto.floor }),
          ...(updateDto.additionalInfo !== undefined && {
            additionalInfo: updateDto.additionalInfo,
          }),
          ...(updateDto.type !== undefined && { type: updateDto.type }),
          ...(updateDto.description !== undefined && { description: updateDto.description }),
          updatedAt: new Date(),
        })
        .where(and(eq(locations.id, id), eq(locations.userId, userId)))
        .returning();

      this.logger.log(`Location updated: ${id}`);

      return successResponse(this.mapToLocationResponse(updated), 'routes.locations.updated');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update location: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.locations.failed_update',
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

      return successResponse({ message: 'routes.locations.deleted' }, 'routes.locations.deleted');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete location: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.locations.failed_delete',
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
          `routes.locations.not_found_with_id`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
          { locationId: id },
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
      area: location.area,
      apartmentNo: location.apartmentNo,
      officeNo: location.officeNo,
      floor: location.floor,
      additionalInfo: location.additionalInfo,
      type: location.type,
      description: location.description,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }
}
