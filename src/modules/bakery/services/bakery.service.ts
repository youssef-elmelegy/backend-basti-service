import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { bakeries, regions, orders } from '@/db/schema';
import { eq, desc, asc, sql, getTableColumns, and, inArray } from 'drizzle-orm';
import { CreateBakeryDto, UpdateBakeryDto, BakeryResponse, PaginationDto, SortDto } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { TranslationService } from '@/common/translation/translation.service';

@Injectable()
export class BakeryService {
  private readonly logger = new Logger(BakeryService.name);

  constructor(private readonly translationService: TranslationService) {}

  async create(createBakeryDto: CreateBakeryDto): Promise<SuccessResponse<BakeryResponse>> {
    const { name, locationDescription, regionId, capacity, bakeryTypes } = createBakeryDto;

    // Validate region exists
    const existingRegion = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);

    if (existingRegion.length === 0) {
      this.logger.warn(`Bakery creation failed: Invalid region ID`);
      throw new BadRequestException(
        errorResponse(
          'routes.regions.not_found_with_id',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { regionId },
        ),
      );
    }

    const nameObject = await this.translationService.getTranslationObject(name);
    const locationDescriptionObject =
      await this.translationService.getTranslationObject(locationDescription);

    try {
      const [newBakery] = await db
        .insert(bakeries)
        .values({
          name: nameObject,
          locationDescription: locationDescriptionObject,
          regionId,
          capacity,
          bakeryTypes: bakeryTypes as ('large_cakes' | 'small_cakes' | 'others')[],
        })
        .returning({
          ...getTableColumns(bakeries),
          name: this.translationService.getLocalized(bakeries.name, 'name'),
          locationDescription: this.translationService.getLocalized(
            bakeries.locationDescription,
            'location_description',
          ),
        });

      this.logger.log(`Bakery created: ${newBakery.id} (${name})`);

      return successResponse(
        this.formatBakeryResponse(newBakery),
        'routes.bakery.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bakery creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(pagination: PaginationDto, sort: SortDto) {
    const { page = 1, limit = 10 } = pagination;

    try {
      const offset = (page - 1) * limit;

      // Get total count (excluding soft-deleted bakeries)
      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(bakeries)
        .where(eq(bakeries.isDeleted, false));
      const total = typeof count === 'string' ? parseInt(count, 10) : count;

      const sortOrder = sort.order === 'desc' ? desc : asc;

      const allBakeries = await db
        .select({
          ...getTableColumns(bakeries),
          name: this.translationService.getLocalized(bakeries.name, 'name'),
          locationDescription: this.translationService.getLocalized(
            bakeries.locationDescription,
            'location_description',
          ),
        })
        .from(bakeries)
        .where(eq(bakeries.isDeleted, false))
        .orderBy(sort.sort === 'alpha' ? sortOrder(bakeries.name) : sortOrder(bakeries.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved bakeries: page ${page}, total ${total}`);

      const formattedBakeries = allBakeries.map((bakery) => this.formatBakeryResponse(bakery));

      this.logger.debug(`Retrieved ${allBakeries.length} bakeries`);

      return successResponse(
        {
          items: formattedBakeries,
          pagination: {
            total,
            totalPages,
            page,
            limit: limit,
          },
        },
        'routes.bakery.list_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve bakeries: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<BakeryResponse>> {
    const [bakery] = await db
      .select({
        ...getTableColumns(bakeries),
        name: this.translationService.getLocalized(bakeries.name, 'name'),
        locationDescription: this.translationService.getLocalized(
          bakeries.locationDescription,
          'location_description',
        ),
      })
      .from(bakeries)
      .where(and(eq(bakeries.id, id), eq(bakeries.isDeleted, false)))
      .limit(1);

    if (!bakery) {
      this.logger.warn(`Bakery not found: ${id}`);
      throw new NotFoundException(
        errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.logger.debug(`Bakery retrieved: ${id}`);

    return successResponse(
      this.formatBakeryResponse(bakery),
      'routes.bakery.retrieved',
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
        errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
          errorResponse('routes.regions.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }
    }

    try {
      const updateData: Record<string, any> = {};

      if (name !== undefined) {
        updateData.name = await this.translationService.getTranslationObject(name);
      }
      if (locationDescription !== undefined) {
        updateData.locationDescription =
          await this.translationService.getTranslationObject(locationDescription);
      }
      if (regionId !== undefined) updateData.regionId = regionId;
      if (capacity !== undefined) updateData.capacity = capacity;
      if (bakeryTypes !== undefined)
        updateData.bakeryTypes = bakeryTypes as ('large_cakes' | 'small_cakes' | 'others')[];
      updateData.updatedAt = new Date();

      const [updatedBakery] = await db
        .update(bakeries)
        .set(updateData)
        .where(eq(bakeries.id, id))
        .returning({
          ...getTableColumns(bakeries),
          name: this.translationService.getLocalized(bakeries.name, 'name'),
          locationDescription: this.translationService.getLocalized(
            bakeries.locationDescription,
            'location_description',
          ),
        });

      this.logger.log(`Bakery updated: ${id}`);

      return successResponse(
        this.formatBakeryResponse(updatedBakery),
        'routes.bakery.updated',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Bakery update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    const [existingBakery] = await db
      .select()
      .from(bakeries)
      .where(and(eq(bakeries.id, id), eq(bakeries.isDeleted, false)))
      .limit(1);

    if (!existingBakery) {
      this.logger.warn(`Bakery deletion failed: Not found - ${id}`);
      throw new NotFoundException(
        errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // A bakery can't be deleted while it still owns in-flight orders — anything
    // pending / confirmed / preparing must be reassigned or completed first.
    const [{ count }] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.bakeryId, id),
          inArray(orders.orderStatus, [
            'pending',
            'confirmed',
            'preparing',
          ] as (typeof orders.orderStatus.enumValues)[number][]),
        ),
      );
    const activeOrders = typeof count === 'string' ? parseInt(count, 10) : count;

    if (activeOrders > 0) {
      this.logger.warn(
        `Bakery deletion blocked: ${id} still has ${activeOrders} active order(s)`,
      );
      throw new BadRequestException(
        errorResponse(
          'routes.bakery.has_active_orders',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          undefined,
          { count: activeOrders },
        ),
      );
    }

    try {
      await db
        .update(bakeries)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(bakeries.id, id));

      this.logger.log(`Bakery soft-deleted: ${id}`);

      return successResponse(
        { message: 'routes.bakery.deleted' },
        'routes.bakery.deleted',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Bakery deletion error for ${id}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.bakery.failed_delete',
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
    averageRating?: string | null;
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
      averageRating: bakery.averageRating ? parseFloat(bakery.averageRating) : undefined,
      totalReviews: bakery.totalReviews,
      createdAt: bakery.createdAt,
      updatedAt: bakery.updatedAt,
    };
  }
}
