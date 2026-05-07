import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { db } from '@/db';
import {
  predesignedCakes,
  regionItemPrices,
  regions,
  tags,
  designedCakeConfigs,
  flavors,
  decorations,
  shapes,
  shapeVariantImages,
} from '@/db/schema';
import { eq, and, or, desc, asc, sql, SQL, getTableColumns, ilike } from 'drizzle-orm';
import {
  CreatePredesignedCakeDto,
  UpdatePredesignedCakeDto,
  GetPredesignedCakesQueryDto,
  CheckEntityRegionAvailabilityDto,
  CreatePredesignedCakeRegionItemPriceDto,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { TranslationService } from '@/common';

type FlattenedPredesignedCake = Omit<typeof predesignedCakes.$inferSelect, 'name' | 'description'> & { 
  name: string; 
  description: string; 
};

@Injectable()
export class PredesignedCakesService {
  private readonly logger = new Logger(PredesignedCakesService.name);

  constructor(private readonly translationService: TranslationService) {}

  async create(
    createDto: CreatePredesignedCakeDto,
  ): Promise<SuccessResponse<Record<string, unknown>>> {
    try {
      if (createDto.tagId) {
        const tagExists = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.id, createDto.tagId))
          .limit(1);

        if (!tagExists.length) {
          throw new BadRequestException(
            errorResponse('routes.tags.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
          );
        }
      }

      // Validate all configs have valid flavor, decoration, and shape
      for (const config of createDto.configs) {
        const [flavorExists] = await db
          .select({ id: flavors.id })
          .from(flavors)
          .where(eq(flavors.id, config.flavorId))
          .limit(1);

        if (!flavorExists) {
          throw new BadRequestException(
            errorResponse(
              `routes.flavors.not_found_with_id`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
              { flavorId: config.flavorId },
            ),
          );
        }

        const [decorationExists] = await db
          .select({ id: decorations.id })
          .from(decorations)
          .where(eq(decorations.id, config.decorationId))
          .limit(1);

        if (!decorationExists) {
          throw new BadRequestException(
            errorResponse(
              `routes.decorations.not_found_with_id`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
              { decorationId: config.decorationId },
            ),
          );
        }

        const [shapeExists] = await db
          .select({ id: shapes.id })
          .from(shapes)
          .where(eq(shapes.id, config.shapeId))
          .limit(1);

        if (!shapeExists) {
          throw new BadRequestException(
            errorResponse(
              `routes.shapes.not_found_with_id`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
              { shapeId: config.shapeId },
            ),
          );
        }
      }

      const nameObject = await this.translationService.getTranslationObject(createDto.name);
      const descriptionObject = await this.translationService.getTranslationObject(createDto.description);

      const [newCake] = await db
        .insert(predesignedCakes)
        .values({
          name: nameObject,
          description: descriptionObject,
          thumbnailUrl: createDto.thumbnailUrl || null,
          tagId: createDto.tagId || null,
        })
        .returning({
          ...getTableColumns(predesignedCakes),
          name: this.translationService.getLocalized(predesignedCakes.name, 'name'),
          description: this.translationService.getLocalized(predesignedCakes.description, 'description'),
        });

      // Create all configs
      for (const config of createDto.configs) {
        await db.insert(designedCakeConfigs).values({
          predesignedCakeId: newCake.id,
          flavorId: config.flavorId,
          decorationId: config.decorationId,
          shapeId: config.shapeId,
          frostColorValue: config.frostColorValue,
        });
      }

      const tagName = createDto.tagId ? await this.getTagName(createDto.tagId) : null;
      const configs = await this.getConfigsWithObjects(newCake.id);

      this.logger.log(`Predesigned cake created: ${newCake.id}`);
      return successResponse(
        { ...newCake, tagName, configs },
        'routes.predesigned_cakes.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create predesigned cake: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(
    query: GetPredesignedCakesQueryDto,
  ): Promise<SuccessResponse<Record<string, unknown>>> {

    const { page = 1, limit = 10 } = query;

    try {
      const offset = (page - 1) * limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn =
        query.sortBy === 'name' ? predesignedCakes.name : predesignedCakes.createdAt;

      let allCakesResult: Array<{
        cake: FlattenedPredesignedCake;
        price?: string;
      }> = [];
      let total = 0;

      // Build WHERE conditions
      const whereConditions: (SQL | undefined)[] = [];

      // Add tag filter
      if (query.tagId) {
        whereConditions.push(eq(predesignedCakes.tagId, query.tagId));
      }

      // Add isActive filter
      if (query.isActive !== undefined) {
        whereConditions.push(eq(predesignedCakes.isActive, query.isActive));
      }

      // Add search filter
      if (query.search) {
        const searchPattern = `%${query.search}%`;
        whereConditions.push(
            or(
              ilike(
                this.translationService.getLocalized(predesignedCakes.name, null, 'en'), 
                searchPattern
              ),
              ilike(
                this.translationService.getLocalized(predesignedCakes.description, null, 'en'), 
                searchPattern
              ),
            ),
          );
      }

      if (query.regionId) {
        const joinConditions = [
          eq(regionItemPrices.predesignedCakeId, predesignedCakes.id),
          eq(regionItemPrices.regionId, query.regionId),
        ] as const;

        // Count total
        const [{ count: combinedCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${predesignedCakes.id})` })
          .from(predesignedCakes)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        total = Number(combinedCount);

        // Fetch with pricing
        allCakesResult = await db
          .select({
            cake: {
              ...getTableColumns(predesignedCakes),
              name: this.translationService.getLocalized(predesignedCakes.name, 'name'),
              description: this.translationService.getLocalized(predesignedCakes.description, 'description'),
            },
            price: regionItemPrices.price,
          })
          .from(predesignedCakes)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else {
        // No regionId filter
        const finalWhereCondition =
          whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Count total
        const [{ count: totalCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(predesignedCakes)
          .where(finalWhereCondition);

        total = Number(totalCount);

        // Fetch without pricing
        allCakesResult = await db
          .select({
            cake: {
              ...getTableColumns(predesignedCakes),
              name: this.translationService.getLocalized(predesignedCakes.name, 'name'),
              description: this.translationService.getLocalized(predesignedCakes.description, 'description'),
            },
          })
          .from(predesignedCakes)
          .where(finalWhereCondition)
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      }

      const totalPages = Math.ceil(total / limit);

      // Get tag names, configs, and format pricing for all items
      const itemsWithTagsAndConfigs = await Promise.all(
        allCakesResult.map(
          async (result: { cake: FlattenedPredesignedCake; price?: string }) => {
            const tagName = result.cake.tagId ? await this.getTagName(result.cake.tagId) : null;
            const configs = await this.getConfigIds(result.cake.id);
            const item = {
              ...result.cake,
              tagName,
              configs,
              ...(result.price && { price: result.price }),
            };

            return item;
          },
        ),
      );

      this.logger.log(`Retrieved predesigned cakes: page ${page}, limit ${limit}`);
      return successResponse(
        {
          items: itemsWithTagsAndConfigs,
          pagination: {
            total,
            totalPages,
            page: page,
            limit: limit,
          },
        },
        'routes.predesigned_cakes.list_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve predesigned cakes: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<Record<string, unknown>>> {
    try {
      const cake = await db
        .select()
        .from(predesignedCakes)
        .where(eq(predesignedCakes.id, id))
        .limit(1);

      if (!cake.length) {
        throw new NotFoundException(
          errorResponse('routes.predesigned_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const tagName = cake[0].tagId ? await this.getTagName(cake[0].tagId) : null;
      const configs = await this.getConfigsWithObjects(id);

      this.logger.log(`Retrieved predesigned cake: ${id}`);
      return successResponse(
        { ...cake[0], tagName, configs },
        'routes.predesigned_cakes.retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve predesigned cake: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_retrieve',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdatePredesignedCakeDto,
  ): Promise<SuccessResponse<Record<string, unknown>>> {
    try {
      const cakeExists = await db
        .select({ id: predesignedCakes.id })
        .from(predesignedCakes)
        .where(eq(predesignedCakes.id, id))
        .limit(1);

      if (!cakeExists.length) {
        throw new NotFoundException(
          errorResponse('routes.predesigned_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      if (updateDto.tagId) {
        const tagExists = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.id, updateDto.tagId))
          .limit(1);

        if (!tagExists.length) {
          throw new BadRequestException(
            errorResponse('routes.tags.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
          );
        }
      }

      // Validate all configs if provided
      if (updateDto.configs && updateDto.configs.length > 0) {
        for (const config of updateDto.configs) {
          const [flavorExists] = await db
            .select({ id: flavors.id })
            .from(flavors)
            .where(eq(flavors.id, config.flavorId))
            .limit(1);

          if (!flavorExists) {
            throw new BadRequestException(
              errorResponse(
                `routes.flavors.not_found_with_id`,
                HttpStatus.BAD_REQUEST,
                'BadRequestException',
                { flavorId: config.flavorId },
              ),
            );
          }

          const [decorationExists] = await db
            .select({ id: decorations.id })
            .from(decorations)
            .where(eq(decorations.id, config.decorationId))
            .limit(1);

          if (!decorationExists) {
            throw new BadRequestException(
              errorResponse(
                `routes.decorations.not_found_with_id`,
                HttpStatus.BAD_REQUEST,
                'BadRequestException',
                { decorationId: config.decorationId },
              ),
            );
          }

          const [shapeExists] = await db
            .select({ id: shapes.id })
            .from(shapes)
            .where(eq(shapes.id, config.shapeId))
            .limit(1);

          if (!shapeExists) {
            throw new BadRequestException(
              errorResponse(
                `routes.shapes.not_found_with_id`,
                HttpStatus.BAD_REQUEST,
                'BadRequestException',
                { shapeId: config.shapeId },
              ),
            );
          }
        }

        // Delete existing configs and create new ones
        await db.delete(designedCakeConfigs).where(eq(designedCakeConfigs.predesignedCakeId, id));

        for (const config of updateDto.configs) {
          await db.insert(designedCakeConfigs).values({
            predesignedCakeId: id,
            flavorId: config.flavorId,
            decorationId: config.decorationId,
            shapeId: config.shapeId,
            frostColorValue: config.frostColorValue,
          });
        }
      }

      const updateValues: Record<string, any> = {};
      if (updateDto.name) {
        updateValues.name = await this.translationService.getTranslationObject(updateDto.name);
      }
      if (updateDto.description) {
        updateValues.description = await this.translationService.getTranslationObject(updateDto.description);
      }
      if (updateDto.thumbnailUrl !== undefined) updateValues.thumbnailUrl = updateDto.thumbnailUrl;
      if (updateDto.tagId !== undefined) updateValues.tagId = updateDto.tagId;

      const [updatedCake] = await db
        .update(predesignedCakes)
        .set(updateValues)
        .where(eq(predesignedCakes.id, id))
        .returning();

      const tagName = updatedCake.tagId ? await this.getTagName(updatedCake.tagId) : null;
      const configs = await this.getConfigsWithObjects(id);

      this.logger.log(`Predesigned cake updated: ${id}`);
      return successResponse(
        { ...updatedCake, tagName, configs },
        'routes.predesigned_cakes.updated',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update predesigned cake ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<null>> {
    try {
      const cakeExists = await db
        .select({ id: predesignedCakes.id })
        .from(predesignedCakes)
        .where(eq(predesignedCakes.id, id))
        .limit(1);

      if (!cakeExists.length) {
        throw new NotFoundException(
          errorResponse('routes.predesigned_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(predesignedCakes).where(eq(predesignedCakes.id, id));

      this.logger.log(`Predesigned cake deleted: ${id}`);
      return successResponse(null, 'routes.predesigned_cakes.deleted', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete predesigned cake ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async toggleStatus(id: string) {
    try {
      const [existingCake] = await db
        .select()
        .from(predesignedCakes)
        .where(eq(predesignedCakes.id, id))
        .limit(1);

      if (!existingCake) {
        this.logger.warn(`Predesigned cake not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.predesigned_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [updatedCake] = await db
        .update(predesignedCakes)
        .set({
          isActive: !existingCake.isActive,
          updatedAt: new Date(),
        })
        .where(eq(predesignedCakes.id, id))
        .returning();

      const statusText = updatedCake.isActive ? 'activated' : 'deactivated';
      this.logger.log(`Predesigned cake status toggled (${statusText}): ${id}`);

      let tagName = updatedCake.tagId ? await this.getTagName(updatedCake.tagId) : null;

      return successResponse(
        {
          id: updatedCake.id,
          name: updatedCake.name,
          description: updatedCake.description,
          thumbnailUrl: updatedCake.thumbnailUrl,
          isActive: updatedCake.isActive,
          tag: tagName || null,
          createdAt: updatedCake.createdAt,
          updatedAt: updatedCake.updatedAt,
        },
        `routes.predesigned_cakes.status_toggled`,
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to toggle predesigned cake status ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_toggle_status',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async checkEntityRegionAvailability(
    checkDto: CheckEntityRegionAvailabilityDto,
  ): Promise<SuccessResponse<Record<string, unknown>>> {
    try {
      // Check if region exists
      const regionExists = await db
        .select({ id: regions.id })
        .from(regions)
        .where(eq(regions.id, checkDto.regionId))
        .limit(1);

      if (!regionExists.length) {
        throw new BadRequestException(
          errorResponse('routes.regions.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      // Check flavor availability
      const flavorAvailable = await db
        .select()
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.flavorId, checkDto.entityId),
            eq(regionItemPrices.regionId, checkDto.regionId),
          ),
        )
        .limit(1);

      // Check shape availability
      const shapeAvailable = await db
        .select()
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.shapeId, checkDto.entityId),
            eq(regionItemPrices.regionId, checkDto.regionId),
          ),
        )
        .limit(1);

      // Check decoration availability
      const decorationAvailable = await db
        .select()
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.decorationId, checkDto.entityId),
            eq(regionItemPrices.regionId, checkDto.regionId),
          ),
        )
        .limit(1);

      const availability = {
        flavorAvailable: flavorAvailable.length > 0,
        shapeAvailable: shapeAvailable.length > 0,
        decorationAvailable: decorationAvailable.length > 0,

        entityId: checkDto.entityId,

        regionId: checkDto.regionId,
      };

      this.logger.log(`Checked entity availability in region: ${JSON.stringify(availability)}`);
      return successResponse(
        availability,
        'Entity availability checked successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to check entity availability: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.entity_region_check_failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async getConfigsWithObjects(predesignedCakeId: string) {
    const configsWithImages = await db
      .select({
        id: designedCakeConfigs.id,
        flavorId: designedCakeConfigs.flavorId,
        decorationId: designedCakeConfigs.decorationId,
        shapeId: designedCakeConfigs.shapeId,
        frostColorValue: designedCakeConfigs.frostColorValue,
        createdAt: designedCakeConfigs.createdAt,
        updatedAt: designedCakeConfigs.updatedAt,
        flavor: {
          id: flavors.id,
          title: this.translationService.getLocalized(flavors.title, 'title'),
          description: this.translationService.getLocalized(flavors.description, 'description'),
          flavorUrl: flavors.flavorUrl,
          createdAt: flavors.createdAt,
          updatedAt: flavors.updatedAt,
        },
        decoration: {
          id: decorations.id,
          title: this.translationService.getLocalized(decorations.title, 'title'),
          description: this.translationService.getLocalized(decorations.description, 'description'),
          decorationUrl: decorations.decorationUrl,
          tagId: decorations.tagId,
          createdAt: decorations.createdAt,
          updatedAt: decorations.updatedAt,
        },
        shape: {
          id: shapes.id,
          title: this.translationService.getLocalized(shapes.title, 'title'),
          description: this.translationService.getLocalized(shapes.description, 'description'),
          shapeUrl: shapes.shapeUrl,
          createdAt: shapes.createdAt,
          updatedAt: shapes.updatedAt,
        },
        variantImage: {
          id: shapeVariantImages.id,
          flavorId: shapeVariantImages.flavorId,
          decorationId: shapeVariantImages.decorationId,
          slicedViewUrl: shapeVariantImages.slicedViewUrl,
          frontViewUrl: shapeVariantImages.frontViewUrl,
          topViewUrl: shapeVariantImages.topViewUrl,
          createdAt: shapeVariantImages.createdAt,
          updatedAt: shapeVariantImages.updatedAt,
        },
      })
      .from(designedCakeConfigs)
      .innerJoin(flavors, eq(designedCakeConfigs.flavorId, flavors.id))
      .innerJoin(decorations, eq(designedCakeConfigs.decorationId, decorations.id))
      .innerJoin(shapes, eq(designedCakeConfigs.shapeId, shapes.id))
      .leftJoin(
        shapeVariantImages,
        or(
          and(
            eq(shapeVariantImages.shapeId, designedCakeConfigs.shapeId),
            eq(shapeVariantImages.flavorId, designedCakeConfigs.flavorId),
          ),
          and(
            eq(shapeVariantImages.shapeId, designedCakeConfigs.shapeId),
            eq(shapeVariantImages.decorationId, designedCakeConfigs.decorationId),
          ),
        ),
      )
      .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

    // Group the results by config ID to consolidate variant images
    const configMap = new Map<
      string,
      {
        id: string;
        flavor: {
          id: string;
          title: string;
          description: string;
          flavorUrl: string;
          shapeVariantImages: Array<{
            id: string;
            slicedViewUrl: string;
            frontViewUrl: string;
            topViewUrl: string;
            createdAt: Date;
            updatedAt: Date;
          }>;
          createdAt: Date;
          updatedAt: Date;
        };
        decoration: {
          id: string;
          title: string;
          description: string;
          decorationUrl: string;
          tagId: string | null;
          shapeVariantImages: Array<{
            id: string;
            slicedViewUrl: string;
            frontViewUrl: string;
            topViewUrl: string;
            createdAt: Date;
            updatedAt: Date;
          }>;
          createdAt: Date;
          updatedAt: Date;
        };
        shape: {
          id: string;
          title: string;
          description: string;
          shapeUrl: string;
          createdAt: Date;
          updatedAt: Date;
        };
        frostColorValue: string;
        createdAt: Date;
        updatedAt: Date;
      }
    >();

    configsWithImages.forEach((row) => {
      if (!configMap.has(row.id)) {
        configMap.set(row.id, {
          id: row.id,
          flavor: {
            ...row.flavor,
            shapeVariantImages: [],
          },
          decoration: {
            ...row.decoration,
            shapeVariantImages: [],
          },
          shape: row.shape,
          frostColorValue: row.frostColorValue,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
      }

      const config = configMap.get(row.id);
      if (row.variantImage && row.variantImage.id) {
        // Add to flavor variant images if it matches the flavor
        if (row.variantImage.flavorId === row.flavorId) {
          config?.flavor.shapeVariantImages.push(row.variantImage);
        }
        // Add to decoration variant images if it matches the decoration
        if (row.variantImage.decorationId === row.decorationId) {
          config?.decoration.shapeVariantImages.push(row.variantImage);
        }
      }
    });

    return Array.from(configMap.values());
  }

  private async getConfigIds(predesignedCakeId: string) {
    const configs = await db
      .select({
        id: designedCakeConfigs.id,
        flavorId: designedCakeConfigs.flavorId,
        decorationId: designedCakeConfigs.decorationId,
        shapeId: designedCakeConfigs.shapeId,
        frostColorValue: designedCakeConfigs.frostColorValue,
      })
      .from(designedCakeConfigs)
      .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

    return configs;
  }

  private async getTagName(tagId: string): Promise<string> {
    const tag = await db
    .select({ 
      name: this.translationService.getLocalized(tags.name, 'name')
    })
    .from(tags)
    .where(eq(tags.id, tagId)).limit(1);
    return tag.length > 0 ? tag[0].name : '';
  }

  async createRegionItemPrice(
    createDto: CreatePredesignedCakeRegionItemPriceDto,
  ): Promise<SuccessResponse<Record<string, unknown>>> {
    try {
      // Validate region exists
      const regionExists = await db
        .select({ id: regions.id })
        .from(regions)
        .where(eq(regions.id, createDto.regionId))
        .limit(1);

      if (!regionExists.length) {
        throw new BadRequestException(
          errorResponse('routes.regions.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      const cakeExists = await db
        .select({ id: predesignedCakes.id })
        .from(predesignedCakes)
        .where(eq(predesignedCakes.id, createDto.predesignedCakeId))
        .limit(1);

      if (!cakeExists.length) {
        throw new BadRequestException(
          errorResponse(
            'routes.predesigned_cakes.not_found',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      // Get predesigned cake configs to fetch flavor, decoration, and shape IDs
      const cakeConfigs = await db
        .select({
          flavorId: designedCakeConfigs.flavorId,
          decorationId: designedCakeConfigs.decorationId,
          shapeId: designedCakeConfigs.shapeId,
        })
        .from(designedCakeConfigs)
        .where(eq(designedCakeConfigs.predesignedCakeId, createDto.predesignedCakeId))
        .limit(1);

      if (!cakeConfigs.length) {
        throw new BadRequestException(
          errorResponse(
            'routes.predesigned_cakes.no_configs',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const config = cakeConfigs[0];

      // Get prices for flavor, decoration, and shape in this region
      const flavorPrice = await db
        .select({ price: regionItemPrices.price })
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.flavorId, config.flavorId),
            eq(regionItemPrices.regionId, createDto.regionId),
          ),
        )
        .limit(1);

      if (!flavorPrice.length) {
        throw new BadRequestException(
          errorResponse(
            `routes.cakes.no_flavor_price`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const decorationPrice = await db
        .select({ price: regionItemPrices.price })
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.decorationId, config.decorationId),
            eq(regionItemPrices.regionId, createDto.regionId),
          ),
        )
        .limit(1);

      if (!decorationPrice.length) {
        throw new BadRequestException(
          errorResponse(
            `routes.cakes.no_decoration_price`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const shapePrice = await db
        .select({ price: regionItemPrices.price })
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.shapeId, config.shapeId),
            eq(regionItemPrices.regionId, createDto.regionId),
          ),
        )
        .limit(1);

      if (!shapePrice.length) {
        throw new BadRequestException(
          errorResponse(
            `routes.cakes.no_shape_price`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      // Calculate total price by summing all component prices
      const totalPrice = (
        parseFloat(flavorPrice[0].price) +
        parseFloat(decorationPrice[0].price) +
        parseFloat(shapePrice[0].price)
      ).toFixed(2);

      // Check if pricing already exists for this region and predesigned cake
      const existingPrice: { id: string }[] = await db
        .select({ id: regionItemPrices.id })
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.predesignedCakeId, createDto.predesignedCakeId),
            eq(regionItemPrices.regionId, createDto.regionId),
          ),
        )
        .limit(1);

      let result: typeof regionItemPrices.$inferSelect;
      if (existingPrice.length) {
        // Update existing pricing
        const updateResult = await db
          .update(regionItemPrices)
          .set({
            price: totalPrice,
          })
          .where(eq(regionItemPrices.id, existingPrice[0].id))
          .returning();

        result = updateResult[0];

        this.logger.log(`Predesigned cake region price updated: ${result.id}`);
        return successResponse(
          result,
          'routes.predesigned_cakes.region_pricing_updated',
          HttpStatus.OK,
        );
      } else {
        // Create new pricing
        const insertResult = await db
          .insert(regionItemPrices)
          .values({
            regionId: createDto.regionId,
            predesignedCakeId: createDto.predesignedCakeId,
            price: totalPrice,
            addonId: null,
            featuredCakeId: null,
            sweetId: null,
            decorationId: null,
            shapeId: null,
            flavorId: null,
          })
          .returning();

        result = insertResult[0];

        this.logger.log(`Predesigned cake region price created: ${result.id}`);
        return successResponse(
          result,
          'routes.predesigned_cakes.region_pricing_created',
          HttpStatus.CREATED,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create predesigned cake region price: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.region_pricing_failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
