import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { addons } from '@/db/schema';
import { eq, desc, sql, asc } from 'drizzle-orm';
import { CreateAddDto, UpdateAddDto, PaginationDto, SortDto } from '../dto';
import { errorResponse, successResponse } from '@/utils';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';

@Injectable()
export class AddService {
  private readonly logger = new Logger(AddService.name);

  async create(createAddDto: CreateAddDto) {
    const { name, description, images, category, price, tags, isActive = true } = createAddDto;

    try {
      const [newAdd] = await db
        .insert(addons)
        .values({
          name,
          description,
          images,
          category: category,
          price: price.toString(),
          tags,
          isActive,
        })
        .returning();

      this.logger.log(`Add-on created: ${newAdd.id} (${name})`);

      return successResponse(
        this.mapToAddResponse(newAdd),
        'Add-on created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create add-on: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to create add-on', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findAll(paginationDto: PaginationDto, sortDto: SortDto) {
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT } = paginationDto;

    try {
      const offset = (page - 1) * limit;

      // Get total count
      const [{ count: total }] = await db.select({ count: sql<number>`COUNT(*)` }).from(addons);

      const sortOrder = sortDto.order === 'desc' ? desc : asc;

      // Get paginated add-ons
      const allAdds = await db
        .select()
        .from(addons)
        .orderBy(sortDto.sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved add-ons: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allAdds.map((add) => this.mapToAddResponse(add)),
          pagination: {
            total,
            limit,
            page,
            totalPages,
          },
        },
        'Add-ons retrieved successfully',
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve add-ons: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to retrieve add-ons', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findOne(id: string) {
    try {
      const [add] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);

      if (!add) {
        this.logger.warn(`Add-on not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      this.logger.debug(`Retrieved add-on: ${id}`);
      return successResponse(this.mapToAddResponse(add), 'Add-on retrieved successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve add-on: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to retrieve add-on', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async update(id: string, updateAddDto: UpdateAddDto) {
    try {
      // Check if add-on exists
      const [existingAdd] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);

      if (!existingAdd) {
        this.logger.warn(`Add-on not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      // Build update object with only provided fields
      const updateData: Record<string, any> = {};
      if (updateAddDto.name !== undefined) updateData.name = updateAddDto.name;
      if (updateAddDto.description !== undefined) updateData.description = updateAddDto.description;
      if (updateAddDto.images !== undefined) updateData.images = updateAddDto.images;
      if (updateAddDto.category !== undefined) updateData.category = updateAddDto.category;
      if (updateAddDto.price !== undefined) updateData.price = updateAddDto.price.toString();
      if (updateAddDto.tags !== undefined) updateData.tags = updateAddDto.tags;
      if (updateAddDto.isActive !== undefined) updateData.isActive = updateAddDto.isActive;
      updateData.updatedAt = new Date();

      const [updatedAdd] = await db
        .update(addons)
        .set(updateData)
        .where(eq(addons.id, id))
        .returning();

      this.logger.log(`Add-on updated: ${id}`);

      return successResponse(this.mapToAddResponse(updatedAdd), 'Add-on updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update add-on: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to update add-on', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async remove(id: string) {
    try {
      // Check if add-on exists
      const [add] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);

      if (!add) {
        this.logger.warn(`Add-on not found for deletion: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      await db.delete(addons).where(eq(addons.id, id));

      this.logger.log(`Add-on deleted: ${id}`);

      return successResponse(
        { message: 'Add-on deleted successfully' },
        'Add-on deleted successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete add-on: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to delete add-on', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async toggleStatus(id: string) {
    try {
      // Check if add-on exists
      const [existingAdd] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);

      if (!existingAdd) {
        this.logger.warn(`Add-on not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [updatedAdd] = await db
        .update(addons)
        .set({
          isActive: !existingAdd.isActive,
          updatedAt: new Date(),
        })
        .where(eq(addons.id, id))
        .returning();

      const statusText = updatedAdd.isActive ? 'activated' : 'deactivated';
      this.logger.log(`Add-on status toggled (${statusText}): ${id}`);

      return successResponse(
        this.mapToAddResponse(updatedAdd),
        `Add-on ${statusText} successfully`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to toggle add-on status: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to toggle add-on status', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  private mapToAddResponse(add: typeof addons.$inferSelect) {
    return {
      id: add.id,
      name: add.name,
      description: add.description,
      images: add.images,
      category: add.category,
      price: parseFloat(add.price),
      tags: add.tags,
      isActive: add.isActive,
      createdAt: add.createdAt,
      updatedAt: add.updatedAt,
    };
  }
}
