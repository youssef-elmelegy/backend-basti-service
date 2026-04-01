import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { addons, tags, regionItemPrices, regions, addonOptions } from '@/db/schema';
import { eq, desc, sql, asc, and, SQL, inArray } from 'drizzle-orm';
import {
  CreateAddonDto,
  UpdateAddonDto,
  GetAddonsQueryDto,
  CreateAddonRegionItemPriceDto,
} from '../dto';
import { errorResponse, successResponse } from '@/utils';
import { BakeryItemStoreService } from '../../bakery/services/bakery-item-store.service';

@Injectable()
export class AddonService {
  private readonly logger = new Logger(AddonService.name);

  constructor(private readonly bakeryItemStoreService: BakeryItemStoreService) {}

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
    const { name, description, images, category, tagId, isActive = true, options } = createAddonDto;

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

      let tagName: string | undefined;
      if (newAddon.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, newAddon.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      // Handle options if provided
      let createdOptions: Array<typeof addonOptions.$inferSelect> = [];
      if (options && options.length > 0) {
        const optionsToInsert = options.map((option) => ({
          addonId: newAddon.id,
          type: option.type,
          label: option.label,
          value: option.value,
          imageUrl: option.imageUrl || null,
        }));

        createdOptions = await db.insert(addonOptions).values(optionsToInsert).returning();
        this.logger.log(`Created ${createdOptions.length} options for add-on: ${newAddon.id}`);
      }

      return successResponse(
        this.mapToAddonResponse(newAddon, tagName, undefined, undefined, createdOptions),
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
    const { page, limit, tag, order, sort, isActive, category, regionId, search } = query;

    try {
      const pageValue = page ?? 1;
      const limitValue = limit ?? 10;
      const offset = (pageValue - 1) * limitValue;
      const sortOrder = order === 'desc' ? desc : asc;

      let allAddons: Array<{
        addon: typeof addons.$inferSelect;
        tagName: string | null;
        price?: string;
        sizesPrices?: Record<string, string> | null;
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
        if (search) {
          const searchPattern = `%${search}%`;
          regionWhereConditions.push(sql`LOWER(${addons.name}) LIKE LOWER(${searchPattern})`);
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
          .limit(limitValue)
          .offset(offset);
      } else if (tag) {
        const tagConditions: SQL[] = [eq(tags.name, tag), ...whereConditions];
        if (search) {
          const searchPattern = `%${search}%`;
          tagConditions.push(sql`LOWER(${addons.name}) LIKE LOWER(${searchPattern})`);
        }

        const tagResults = await db
          .select({
            addon: addons,
            tagName: tags.name,
          })
          .from(addons)
          .innerJoin(tags, eq(addons.tagId, tags.id))
          .where(and(...tagConditions))
          .orderBy(sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
          .limit(limitValue)
          .offset(offset);

        allAddons = tagResults;

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${addons.id})` })
          .from(addons)
          .innerJoin(tags, eq(addons.tagId, tags.id))
          .where(and(...tagConditions));

        total = Number(countResult.count);
      } else if (search) {
        const searchPattern = `%${search}%`;
        const searchConditions: SQL[] = [
          sql`LOWER(${addons.name}) LIKE LOWER(${searchPattern})`,
          ...whereConditions,
        ];

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(addons)
          .where(and(...searchConditions));

        total = Number(countResult.count);

        const untaggedResults = await db
          .select({
            addon: addons,
            tagName: tags.name,
          })
          .from(addons)
          .leftJoin(tags, eq(addons.tagId, tags.id))
          .where(and(...searchConditions))
          .orderBy(sort === 'alpha' ? sortOrder(addons.name) : sortOrder(addons.createdAt))
          .limit(limitValue)
          .offset(offset);

        allAddons = untaggedResults;
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
          .limit(limitValue)
          .offset(offset);

        allAddons = untaggedResults;

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(addons)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
        total = Number(countResult.count);
      }

      const totalPages = Math.ceil(total / limitValue);
      const addonIds = [...new Set(allAddons.map((item) => item.addon.id))];
      const optionsByAddonId = await this.getAddonOptionsByAddonIds(addonIds);

      this.logger.debug(`Retrieved add-ons: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allAddons.map((item) =>
            this.mapToAddonResponse(
              item.addon,
              item.tagName,
              item.price,
              item.sizesPrices,
              optionsByAddonId.get(item.addon.id) || [],
            ),
          ),
          pagination: {
            total,
            limit: limitValue,
            page: pageValue,
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
      const optionsByAddonId = await this.getAddonOptionsByAddonIds([addon.id]);

      this.logger.debug(`Retrieved add-on: ${id}`);
      return successResponse(
        this.mapToAddonResponse(
          addon,
          tagName,
          undefined,
          undefined,
          optionsByAddonId.get(addon.id) || [],
        ),
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
      let tagName: string | undefined;
      if (updatedAddon.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedAddon.tagId))
          .limit(1);
        tagName = tagResult[0]?.name;
      }

      // Handle options if provided
      let updatedOptions: Array<typeof addonOptions.$inferSelect> = [];
      if (updateAddonDto.options !== undefined) {
        // Get existing options
        const existingOptions = await db
          .select()
          .from(addonOptions)
          .where(eq(addonOptions.addonId, id));

        const existingOptionIds = new Set(existingOptions.map((opt) => opt.id));
        const incomingOptionIds = new Set<string>();

        // Process incoming options (create new, update existing)
        for (const option of updateAddonDto.options) {
          if (option.id) {
            // Update existing option
            incomingOptionIds.add(option.id);
            const [updated] = await db
              .update(addonOptions)
              .set({
                ...(option.type !== undefined ? { type: option.type } : {}),
                ...(option.label !== undefined ? { label: option.label } : {}),
                ...(option.value !== undefined ? { value: option.value } : {}),
                ...(option.imageUrl !== undefined ? { imageUrl: option.imageUrl } : {}),
              })
              .where(eq(addonOptions.id, option.id))
              .returning();

            if (updated) {
              updatedOptions.push(updated);
            }
          } else {
            // Create new option
            const [created] = await db
              .insert(addonOptions)
              .values({
                addonId: id,
                type: option.type || 'text',
                label: option.label || '',
                value: option.value || '',
                imageUrl: option.imageUrl || null,
              })
              .returning();

            if (created) {
              updatedOptions.push(created);
              incomingOptionIds.add(created.id);
            }
          }
        }

        // Delete options that are not in the incoming list
        const optionsToDelete = Array.from(existingOptionIds).filter(
          (id) => !incomingOptionIds.has(id),
        );

        if (optionsToDelete.length > 0) {
          await db.delete(addonOptions).where(inArray(addonOptions.id, optionsToDelete));
          this.logger.log(`Deleted ${optionsToDelete.length} options for add-on: ${id}`);
        }

        this.logger.log(`Updated ${updatedOptions.length} options for add-on: ${id}`);
      } else {
        // If options not provided, fetch existing options to include in response
        updatedOptions = await db.select().from(addonOptions).where(eq(addonOptions.addonId, id));
      }

      return successResponse(
        this.mapToAddonResponse(updatedAddon, tagName, undefined, undefined, updatedOptions),
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

      let tagName: string | undefined;
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

        // Create bakery item stores for all bakeries in this region
        await this.bakeryItemStoreService.createStoresForRegionItemPrice(
          regionItemPrice.id,
          regionId,
        );
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
    tagName?: string | null,
    price?: string,
    sizesPrices?: Record<string, string> | null,
    addonOption?: Array<typeof addonOptions.$inferSelect>,
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
      options: addonOption ?? [],
    };
  }

  private async getAddonOptionsByAddonIds(addonIds: string[]) {
    if (!addonIds.length) {
      return new Map<string, Array<typeof addonOptions.$inferSelect>>();
    }

    const options = await db
      .select()
      .from(addonOptions)
      .where(inArray(addonOptions.addonId, addonIds));

    const optionsByAddonId = new Map<string, Array<typeof addonOptions.$inferSelect>>();

    for (const option of options) {
      const existing = optionsByAddonId.get(option.addonId) ?? [];
      existing.push(option);
      optionsByAddonId.set(option.addonId, existing);
    }

    return optionsByAddonId;
  }
}
