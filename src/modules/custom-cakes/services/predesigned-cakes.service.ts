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
} from '@/db/schema';
import { eq, and, or, desc, asc, sql } from 'drizzle-orm';
import {
  CreatePredesignedCakeDto,
  UpdatePredesignedCakeDto,
  GetPredesignedCakesQueryDto,
  CheckEntityRegionAvailabilityDto,
  CreatePredesignedCakeRegionItemPriceDto,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class PredesignedCakesService {
  private readonly logger = new Logger(PredesignedCakesService.name);

  async create(createDto: CreatePredesignedCakeDto): Promise<SuccessResponse<any>> {
    try {
      if (createDto.tagId) {
        const tagExists = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.id, createDto.tagId))
          .limit(1);

        if (!tagExists.length) {
          throw new BadRequestException(
            errorResponse('Tag not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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
              `Flavor not found: ${config.flavorId}`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
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
              `Decoration not found: ${config.decorationId}`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
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
              `Shape not found: ${config.shapeId}`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
            ),
          );
        }
      }

      const [newCake] = await db
        .insert(predesignedCakes)
        .values({
          name: createDto.name,
          description: createDto.description,
          tagId: createDto.tagId || null,
        })
        .returning();

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
        'Predesigned cake created successfully',
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
          'Failed to create predesigned cake',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(query: GetPredesignedCakesQueryDto): Promise<SuccessResponse<any>> {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn =
        query.sortBy === 'name' ? predesignedCakes.name : predesignedCakes.createdAt;

      let allCakesResult: Array<{
        cake: typeof predesignedCakes.$inferSelect;
      }> = [];
      let total = 0;

      if (query.regionId) {
        const joinConditions = [
          eq(regionItemPrices.predesignedCakeId, predesignedCakes.id),
          eq(regionItemPrices.regionId, query.regionId),
        ] as const;

        // If search is also provided, combine both filters
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          const whereCondition = or(
            sql`LOWER(${predesignedCakes.name}) LIKE LOWER(${searchPattern})`,
            sql`LOWER(${predesignedCakes.description}) LIKE LOWER(${searchPattern})`,
          );

          const [{ count: combinedCount }] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${predesignedCakes.id})` })
            .from(predesignedCakes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .where(whereCondition);

          total = Number(combinedCount);

          allCakesResult = await db
            .select({
              cake: predesignedCakes,
            })
            .from(predesignedCakes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .where(whereCondition)
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        } else {
          // Only regionId, no search
          const [{ count: regionCount }] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${predesignedCakes.id})` })
            .from(predesignedCakes)
            .innerJoin(regionItemPrices, and(...joinConditions));

          total = Number(regionCount);

          allCakesResult = await db
            .select({
              cake: predesignedCakes,
            })
            .from(predesignedCakes)
            .innerJoin(regionItemPrices, and(...joinConditions))
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        }
      } else {
        // No regionId filter, optional search
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          const whereCondition = or(
            sql`LOWER(${predesignedCakes.name}) LIKE LOWER(${searchPattern})`,
            sql`LOWER(${predesignedCakes.description}) LIKE LOWER(${searchPattern})`,
          );

          const [{ count: searchCount }] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(predesignedCakes)
            .where(whereCondition);

          total = Number(searchCount);

          allCakesResult = await db
            .select({
              cake: predesignedCakes,
            })
            .from(predesignedCakes)
            .where(whereCondition)
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        } else {
          // No filters at all
          const [{ count: allCount }] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(predesignedCakes);

          total = Number(allCount);

          allCakesResult = await db
            .select({
              cake: predesignedCakes,
            })
            .from(predesignedCakes)
            .orderBy(sortOrder(sortColumn))
            .limit(query.limit)
            .offset(offset);
        }
      }

      const totalPages = Math.ceil(total / query.limit);

      // Get tag names and configs for all items
      const itemsWithTagsAndConfigs = await Promise.all(
        allCakesResult.map(async (result: { cake: typeof predesignedCakes.$inferSelect }) => {
          const tagName = result.cake.tagId ? await this.getTagName(result.cake.tagId) : null;
          const configs = await this.getConfigsWithObjects(result.cake.id);
          return { ...result.cake, tagName, configs };
        }),
      );

      this.logger.log(`Retrieved predesigned cakes: page ${query.page}, limit ${query.limit}`);
      return successResponse(
        {
          items: itemsWithTagsAndConfigs,
          pagination: {
            total,
            totalPages,
            page: query.page,
            limit: query.limit,
          },
        },
        'Predesigned cakes retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve predesigned cakes: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve predesigned cakes',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<any>> {
    try {
      const cake = await db
        .select()
        .from(predesignedCakes)
        .where(eq(predesignedCakes.id, id))
        .limit(1);

      if (!cake.length) {
        throw new NotFoundException(
          errorResponse('Predesigned cake not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const tagName = cake[0].tagId ? await this.getTagName(cake[0].tagId) : null;
      const configs = await this.getConfigsWithObjects(id);

      this.logger.log(`Retrieved predesigned cake: ${id}`);
      return successResponse(
        { ...cake[0], tagName, configs },
        'Predesigned cake retrieved successfully',
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
          'Failed to retrieve predesigned cake',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(id: string, updateDto: UpdatePredesignedCakeDto): Promise<SuccessResponse<any>> {
    try {
      const cakeExists = await db
        .select({ id: predesignedCakes.id })
        .from(predesignedCakes)
        .where(eq(predesignedCakes.id, id))
        .limit(1);

      if (!cakeExists.length) {
        throw new NotFoundException(
          errorResponse('Predesigned cake not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
            errorResponse('Tag not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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
                `Flavor not found: ${config.flavorId}`,
                HttpStatus.BAD_REQUEST,
                'BadRequestException',
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
                `Decoration not found: ${config.decorationId}`,
                HttpStatus.BAD_REQUEST,
                'BadRequestException',
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
                `Shape not found: ${config.shapeId}`,
                HttpStatus.BAD_REQUEST,
                'BadRequestException',
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

      const updateValues: Partial<typeof predesignedCakes.$inferInsert> = {};
      if (updateDto.name) updateValues.name = updateDto.name;
      if (updateDto.description) updateValues.description = updateDto.description;
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
        'Predesigned cake updated successfully',
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
          'Failed to update predesigned cake',
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
          errorResponse('Predesigned cake not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(predesignedCakes).where(eq(predesignedCakes.id, id));

      this.logger.log(`Predesigned cake deleted: ${id}`);
      return successResponse(null, 'Predesigned cake deleted successfully', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete predesigned cake ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete predesigned cake',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async checkEntityRegionAvailability(
    checkDto: CheckEntityRegionAvailabilityDto,
  ): Promise<SuccessResponse<any>> {
    try {
      // Check if region exists
      const regionExists = await db
        .select({ id: regions.id })
        .from(regions)
        .where(eq(regions.id, checkDto.regionId))
        .limit(1);

      if (!regionExists.length) {
        throw new BadRequestException(
          errorResponse('Region not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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
          'Failed to check entity availability',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async getConfigsWithObjects(predesignedCakeId: string) {
    const configs = await db
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
          title: flavors.title,
          description: flavors.description,
          flavorUrl: flavors.flavorUrl,
          createdAt: flavors.createdAt,
          updatedAt: flavors.updatedAt,
        },
        decoration: {
          id: decorations.id,
          title: decorations.title,
          description: decorations.description,
          decorationUrl: decorations.decorationUrl,
          tagId: decorations.tagId,
          createdAt: decorations.createdAt,
          updatedAt: decorations.updatedAt,
        },
        shape: {
          id: shapes.id,
          title: shapes.title,
          description: shapes.description,
          shapeUrl: shapes.shapeUrl,
          createdAt: shapes.createdAt,
          updatedAt: shapes.updatedAt,
        },
      })
      .from(designedCakeConfigs)
      .innerJoin(flavors, eq(designedCakeConfigs.flavorId, flavors.id))
      .innerJoin(decorations, eq(designedCakeConfigs.decorationId, decorations.id))
      .innerJoin(shapes, eq(designedCakeConfigs.shapeId, shapes.id))
      .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

    return configs.map((config) => ({
      id: config.id,
      flavor: config.flavor,
      decoration: config.decoration,
      shape: config.shape,
      frostColorValue: config.frostColorValue,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  }

  private async getTagName(tagId: string): Promise<string> {
    const tag = await db.select({ name: tags.name }).from(tags).where(eq(tags.id, tagId)).limit(1);
    return tag.length > 0 ? tag[0].name : null;
  }

  async createRegionItemPrice(
    createDto: CreatePredesignedCakeRegionItemPriceDto,
  ): Promise<SuccessResponse<any>> {
    try {
      // Validate region exists
      const regionExists = await db
        .select({ id: regions.id })
        .from(regions)
        .where(eq(regions.id, createDto.regionId))
        .limit(1);

      if (!regionExists.length) {
        throw new BadRequestException(
          errorResponse('Region not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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
            'Predesigned cake not found',
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
            'Predesigned cake has no configurations',
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
            `Flavor price not found in this region`,
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
            `Decoration price not found in this region`,
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
            `Shape price not found in this region`,
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
          'Predesigned cake region price updated successfully',
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
          'Predesigned cake region price created successfully',
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
          'Failed to create predesigned cake region price',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
