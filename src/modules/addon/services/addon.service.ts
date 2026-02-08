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
import { CreateAddonDto, UpdateAddonDto, GetAddonsQueryDto } from '../dto';
import { errorResponse, successResponse } from '@/utils';

@Injectable()
export class AddonService {
  private readonly logger = new Logger(AddonService.name);

  async create(createAddonDto: CreateAddonDto) {
    const { name, description, images, category, tagId, isActive = true } = createAddonDto;

    try {
      const [newAddon] = await db
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

      this.logger.log(`Add-on created: ${newAddon.id} (${name})`);

      let tagName: string;
      if (newAddon.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, newAddon.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      return successResponse(
        this.mapToAddonResponse(newAddon, tagName),
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

  async findAll(query: GetAddonsQueryDto) {
    const { page, limit, tag, order, sort } = query;

    try {
      const offset = (page - 1) * limit;
      const sortOrder = order === 'desc' ? desc : asc;

      let allAddons: Array<{ addon: typeof addons.$inferSelect; tagName: string }> = [];
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

        allAddons = tagResults;

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

        allAddons = untaggedResults;

        const [countResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(addons);
        total = countResult.count;
      }

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved add-ons: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allAddons.map((item) => this.mapToAddonResponse(item.addon, item.tagName)),
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
      const addonResult = await db
        .select({
          addon: addons,
          tagName: tags.name,
        })
        .from(addons)
        .leftJoin(tags, eq(addons.tagId, tags.id))
        .where(eq(addons.id, id))
        .limit(1);

      if (!addonResult.length) {
        this.logger.warn(`Add-on not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const { addon, tagName } = addonResult[0];

      this.logger.debug(`Retrieved add-on: ${id}`);
      return successResponse(
        this.mapToAddonResponse(addon, tagName),
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

  async update(id: string, updateAddonDto: UpdateAddonDto) {
    try {
      // Check if add-on exists
      const [existingAddon] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);

      if (!existingAddon) {
        this.logger.warn(`Add-on not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      // Build update object with only provided fields
      const updateData: Record<string, any> = {};
      if (updateAddonDto.name !== undefined) updateData.name = updateAddonDto.name;
      if (updateAddonDto.description !== undefined)
        updateData.description = updateAddonDto.description;
      if (updateAddonDto.images !== undefined) updateData.images = updateAddonDto.images;
      if (updateAddonDto.category !== undefined) updateData.category = updateAddonDto.category;
      if (updateAddonDto.tagId !== undefined) updateData.tagId = updateAddonDto.tagId;
      if (updateAddonDto.isActive !== undefined) updateData.isActive = updateAddonDto.isActive;
      updateData.updatedAt = new Date();

      const [updatedAddon] = await db
        .update(addons)
        .set(updateData)
        .where(eq(addons.id, id))
        .returning();

      this.logger.log(`Add-on updated: ${id}`);

      // Fetch tag name if tagId exists
      let tagName: string;
      if (updatedAddon.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedAddon.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      return successResponse(
        this.mapToAddonResponse(updatedAddon, tagName),
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
      const [addon] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);

      if (!addon) {
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
      const [existingAddon] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);

      if (!existingAddon) {
        this.logger.warn(`Add-on not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [updatedAddon] = await db
        .update(addons)
        .set({
          isActive: !existingAddon.isActive,
          updatedAt: new Date(),
        })
        .where(eq(addons.id, id))
        .returning();

      const statusText = updatedAddon.isActive ? 'activated' : 'deactivated';
      this.logger.log(`Add-on status toggled (${statusText}): ${id}`);

      let tagName: string;
      if (updatedAddon.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedAddon.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      return successResponse(
        this.mapToAddonResponse(updatedAddon, tagName),
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

  private mapToAddonResponse(addon: typeof addons.$inferSelect, tagName?: string) {
    return {
      id: addon.id,
      name: addon.name,
      description: addon.description,
      images: addon.images,
      category: addon.category,
      tagId: addon.tagId,
      tagName: tagName || null,
      isActive: addon.isActive,
      createdAt: addon.createdAt,
      updatedAt: addon.updatedAt,
    };
  }
}
