import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { addons, tags, regionItemPrices, regions } from '@/db/schema';
import { eq, desc, sql, asc, and, SQL } from 'drizzle-orm';
import {
  CreateAddonDto,
  UpdateAddonDto,
  GetAddonsQueryDto,
  CreateAddonRegionItemPriceDto,
} from '../dto';
import { errorResponse, successResponse } from '@/utils';

@Injectable()
export class AddonService {
  private readonly logger = new Logger(AddonService.name);

  private async validateTagExists(tagId: string): Promise<void> {
    if (!tagId) return;

    const [tagExists] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (!tagExists) {
      throw new BadRequestException(
        errorResponse('Tag not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }
  }

  private async validateAddonExists(addonId: string): Promise<void> {
    const [addonExists] = await db
      .select({ id: addons.id })
      .from(addons)
      .where(eq(addons.id, addonId))
      .limit(1);

    if (!addonExists) {
      throw new BadRequestException(
        errorResponse(
          `Addon with ID ${addonId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  private async validateRegionExists(regionId: string): Promise<void> {
    const [regionExists] = await db
      .select({ id: regions.id })
      .from(regions)
      .where(eq(regions.id, regionId))
      .limit(1);

    if (!regionExists) {
      throw new BadRequestException(
        errorResponse(
          `Region with ID ${regionId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  async create(createAddonDto: CreateAddonDto) {
    const { name, description, images, category, tagId, isActive = true } = createAddonDto;

    try {
      if (tagId) {
        await this.validateTagExists(tagId);
      }

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
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create add-on: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to create add-on', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findAll(query: GetAddonsQueryDto) {
    const { page, limit, tag, order, sort, isActive, category, regionId } = query;

    try {
      const offset = (page - 1) * limit;
      const sortOrder = order === 'desc' ? desc : asc;

      let allAddons: Array<{
        addon: typeof addons.$inferSelect;
        tagName: string;
        price?: string;
        sizesPrices?: Record<string, string>;
      }> = [];
      let total = 0;

      // Build where conditions
      const whereConditions: SQL[] = [];
      if (isActive !== undefined && isActive !== null) {
        whereConditions.push(eq(addons.isActive, isActive));
      }
      if (category) {
        whereConditions.push(eq(addons.category, category));
      }

      if (regionId) {
        const joinConditions = [
          eq(regionItemPrices.addonId, addons.id),
          eq(regionItemPrices.regionId, regionId),
        ] as const;

        const regionWhereConditions: SQL[] = [...whereConditions];
        if (tag) {
          regionWhereConditions.push(eq(tags.name, tag));
        }

        const [{ count: regionCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${addons.id})` })
          .from(addons)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(addons.tagId, tags.id))
          .where(regionWhereConditions.length > 0 ? and(...regionWhereConditions) : undefined);

        total = Number(regionCount);

        allAddons = await db
          .select({
            addon: addons,
            tagName: tags.name,
            price: regionItemPrices.price,
            sizesPrices: regionItemPrices.sizesPrices,
          })
          .from(addons)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(addons.tagId, tags.id))
          .where(regionWhereConditions.length > 0 ? and(...regionWhereConditions) : undefined)
          .orderBy(sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
          .limit(limit)
          .offset(offset);
      } else if (tag) {
        const tagResults = await db
          .select({
            addon: addons,
            tagName: tags.name,
          })
          .from(addons)
          .innerJoin(tags, eq(addons.tagId, tags.id))
          .where(
            whereConditions.length > 0
              ? and(eq(tags.name, tag), ...whereConditions)
              : eq(tags.name, tag),
          )
          .orderBy(sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
          .limit(limit)
          .offset(offset);

        allAddons = tagResults;

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${addons.id})` })
          .from(addons)
          .innerJoin(tags, eq(addons.tagId, tags.id))
          .where(
            whereConditions.length > 0
              ? and(eq(tags.name, tag), ...whereConditions)
              : eq(tags.name, tag),
          );

        total = Number(countResult.count);
      } else {
        const untaggedResults = await db
          .select({
            addon: addons,
            tagName: tags.name,
          })
          .from(addons)
          .leftJoin(tags, eq(addons.tagId, tags.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
          .limit(limit)
          .offset(offset);

        allAddons = untaggedResults;

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(addons)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
        total = Number(countResult.count);
      }

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved add-ons: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allAddons.map((item) =>
            this.mapToAddonResponse(item.addon, item.tagName, item.price, item.sizesPrices),
          ),
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

      // Validate tag exists if provided in update
      if (updateAddonDto.tagId !== undefined) {
        await this.validateTagExists(updateAddonDto.tagId);
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
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
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

  async createRegionItemPrice(createAddonRegionItemPriceDto: CreateAddonRegionItemPriceDto) {
    const { addonId, regionId, price, sizesPrices } = createAddonRegionItemPriceDto;

    try {
      // Validate both IDs exist
      await this.validateAddonExists(addonId);
      await this.validateRegionExists(regionId);

      // Check if pricing already exists for this addon and region
      const existingPrice = await db
        .select()
        .from(regionItemPrices)
        .where(and(eq(regionItemPrices.addonId, addonId), eq(regionItemPrices.regionId, regionId)))
        .limit(1);

      let regionItemPrice: typeof regionItemPrices.$inferSelect;
      if (existingPrice.length > 0) {
        const [updated] = await db
          .update(regionItemPrices)
          .set({
            price,
            sizesPrices: sizesPrices || null,
            updatedAt: new Date(),
          })
          .where(
            and(eq(regionItemPrices.addonId, addonId), eq(regionItemPrices.regionId, regionId)),
          )
          .returning();
        regionItemPrice = updated;
        this.logger.log(`Region pricing updated: addon ${addonId}, region ${regionId}`);
      } else {
        const [created] = await db
          .insert(regionItemPrices)
          .values({
            addonId,
            regionId,
            price,
            sizesPrices: sizesPrices || null,
          })
          .returning();
        regionItemPrice = created;
        this.logger.log(`Region pricing created: addon ${addonId}, region ${regionId}`);
      }

      return successResponse(
        {
          addonId: regionItemPrice.addonId,
          regionId: regionItemPrice.regionId,
          price: regionItemPrice.price,
          sizesPrices: regionItemPrice.sizesPrices || undefined,
          createdAt: regionItemPrice.createdAt,
          updatedAt: regionItemPrice.updatedAt,
        },
        'Region pricing created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create region pricing: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create region pricing',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private mapToAddonResponse(
    addon: typeof addons.$inferSelect,
    tagName?: string,
    price?: string,
    sizesPrices?: Record<string, string>,
  ) {
    return {
      id: addon.id,
      name: addon.name,
      description: addon.description,
      images: addon.images,
      category: addon.category,
      tagId: addon.tagId,
      tagName: tagName || null,
      price: price || undefined,
      sizesPrices: sizesPrices || undefined,
      isActive: addon.isActive,
      createdAt: addon.createdAt,
      updatedAt: addon.updatedAt,
    };
  }
}
