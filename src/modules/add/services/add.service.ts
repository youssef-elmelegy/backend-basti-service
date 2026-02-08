import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { addons, tags } from '@/db/schema';
import { eq, desc, sql, asc } from 'drizzle-orm';
import { CreateAddDto, UpdateAddDto, GetAddsQueryDto } from '../dto';
import { errorResponse, successResponse } from '@/utils';

@Injectable()
export class AddService {
  private readonly logger = new Logger(AddService.name);

  async create(createAddDto: CreateAddDto) {
    const { name, description, images, category, tagId, isActive = true } = createAddDto;

    try {
      const [newAdd] = await db
        .insert(addons)
        .values({
          name,
          description,
          images,
          category: category,
          tagId,
          isActive,
        })
        .returning();

      this.logger.log(`Add-on created: ${newAdd.id} (${name})`);

      let tagName: string;
      if (newAdd.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, newAdd.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      return successResponse(
        this.mapToAddResponse(newAdd, tagName),
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

  async findAll(query: GetAddsQueryDto) {
    const { page, limit, tag, order, sort } = query;

    try {
      const offset = (page - 1) * limit;
      const sortOrder = order === 'desc' ? desc : asc;

      let allAdds: Array<{ addon: typeof addons.$inferSelect; tagName: string }> = [];
      let total = 0;

      if (tag) {
        const tagResults = await db
          .select({
            addon: addons,
            tagName: tags.name,
          })
          .from(addons)
          .innerJoin(tags, eq(addons.tagId, tags.id))
          .where(eq(tags.name, tag))
          .orderBy(sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
          .limit(limit)
          .offset(offset);

        allAdds = tagResults;

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${addons.id})` })
          .from(addons)
          .innerJoin(tags, eq(addons.tagId, tags.id))
          .where(eq(tags.name, tag));

        total = countResult.count;
      } else {
        const untaggedResults = await db
          .select({
            addon: addons,
            tagName: tags.name,
          })
          .from(addons)
          .leftJoin(tags, eq(addons.tagId, tags.id))
          .orderBy(sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
          .limit(limit)
          .offset(offset);

        allAdds = untaggedResults;

        const [countResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(addons);
        total = countResult.count;
      }

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved add-ons: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allAdds.map((item) => this.mapToAddResponse(item.addon, item.tagName)),
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
      const addResult = await db
        .select({
          addon: addons,
          tagName: tags.name,
        })
        .from(addons)
        .leftJoin(tags, eq(addons.tagId, tags.id))
        .where(eq(addons.id, id))
        .limit(1);

      if (!addResult.length) {
        this.logger.warn(`Add-on not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const { addon, tagName } = addResult[0];

      this.logger.debug(`Retrieved add-on: ${id}`);
      return successResponse(
        this.mapToAddResponse(addon, tagName),
        'Add-on retrieved successfully',
      );
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
      if (updateAddDto.tagId !== undefined) updateData.tagId = updateAddDto.tagId;
      if (updateAddDto.isActive !== undefined) updateData.isActive = updateAddDto.isActive;
      updateData.updatedAt = new Date();

      const [updatedAdd] = await db
        .update(addons)
        .set(updateData)
        .where(eq(addons.id, id))
        .returning();

      this.logger.log(`Add-on updated: ${id}`);

      // Fetch tag name if tagId exists
      let tagName: string;
      if (updatedAdd.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedAdd.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      return successResponse(
        this.mapToAddResponse(updatedAdd, tagName),
        'Add-on updated successfully',
      );
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

      let tagName: string;
      if (updatedAdd.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedAdd.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      return successResponse(
        this.mapToAddResponse(updatedAdd, tagName),
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

  private mapToAddResponse(add: typeof addons.$inferSelect, tagName?: string) {
    return {
      id: add.id,
      name: add.name,
      description: add.description,
      images: add.images,
      category: add.category,
      tagId: add.tagId,
      tagName: tagName || null,
      isActive: add.isActive,
      createdAt: add.createdAt,
      updatedAt: add.updatedAt,
    };
  }
}
