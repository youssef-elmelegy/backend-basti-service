import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { db } from '@/db';
import { featuredCakes, tags, regionItemPrices, regions } from '@/db/schema';
import { eq, desc, sql, asc, and } from 'drizzle-orm';
import {
  CreateFeaturedCakeDto,
  UpdateFeaturedCakeDto,
  GetFeaturedCakesQueryDto,
  CreateRegionItemPriceDto,
} from '../dto';
import { errorResponse, successResponse } from '@/utils';

@Injectable()
export class FeaturedCakeService {
  private readonly logger = new Logger(FeaturedCakeService.name);

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'unknown error';
  }

  /**
   * Validate that a tag exists by ID
   */
  private async validateTagExists(tagId: string): Promise<void> {
    const tagResult = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (tagResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `Tag with ID ${tagId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  async create(createFeaturedCakeDto: CreateFeaturedCakeDto) {
    const {
      name,
      description,
      images,
      capacity,
      flavorList,
      pipingPaletteList,
      tagId,
      isActive = true,
    } = createFeaturedCakeDto;

    try {
      if (tagId) {
        await this.validateTagExists(tagId);
      }

      const [newCake] = await db
        .insert(featuredCakes)
        .values({
          name,
          description,
          images,
          capacity,
          flavorList,
          pipingPaletteList,
          tagId,
          isActive,
        })
        .returning();

      this.logger.log(`Cake created: ${newCake.id} (${name})`);

      // Fetch tag name if tagId exists
      let tagName: string;
      if (newCake.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, newCake.tagId))
          .limit(1);
        tagName = tagResult[0]?.name || '';
      } else {
        tagName = '';
      }

      return successResponse(
        this.mapToCakeResponse(newCake, tagName),
        'Cake created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = this.getErrorMessage(error);
      this.logger.error(`Failed to create cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to create cake', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findAll(query: GetFeaturedCakesQueryDto) {
    const {
      page: queryPage = 1,
      limit: queryLimit = 10,
      tag,
      order,
      sort,
      regionId,
      search,
    } = query;

    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 10;

    try {
      const offset = (page - 1) * limit;
      const sortOrder = order === 'desc' ? desc : asc;
      const sortColumn = sort === 'alpha' ? featuredCakes.name : featuredCakes.createdAt;

      let allCakesResult: Array<{
        cake: typeof featuredCakes.$inferSelect;
        tagName: string;
        price?: string;
      }> = [];
      let total = 0;

      if (regionId) {
        const joinConditions = [
          eq(regionItemPrices.featuredCakeId, featuredCakes.id),
          eq(regionItemPrices.regionId, regionId),
        ] as const;

        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [];
        if (tag) {
          whereConditions.push(eq(tags.name, tag));
        }
        if (search) {
          const searchPattern = `%${search}%`;
          whereConditions.push(sql`LOWER(${featuredCakes.name}) LIKE LOWER(${searchPattern})`);
        }

        const [{ count: regionCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${featuredCakes.id})` })
          .from(featuredCakes)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        total = Number(regionCount);

        allCakesResult = await db
          .select({
            cake: featuredCakes,
            tagName: tags.name,
            price: regionItemPrices.price,
          })
          .from(featuredCakes)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else if (tag) {
        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [eq(tags.name, tag)];
        if (search) {
          const searchPattern = `%${search}%`;
          whereConditions.push(sql`LOWER(${featuredCakes.name}) LIKE LOWER(${searchPattern})`);
        }

        const [{ count: tagCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${featuredCakes.id})` })
          .from(featuredCakes)
          .innerJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(and(...whereConditions));

        total = Number(tagCount);

        allCakesResult = await db
          .select({
            cake: featuredCakes,
            tagName: tags.name,
          })
          .from(featuredCakes)
          .innerJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(and(...whereConditions))
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else if (search) {
        const searchPattern = `%${search}%`;
        const [{ count: searchCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${featuredCakes.id})` })
          .from(featuredCakes)
          .where(sql`LOWER(${featuredCakes.name}) LIKE LOWER(${searchPattern})`);

        total = Number(searchCount);

        allCakesResult = await db
          .select({
            cake: featuredCakes,
            tagName: tags.name,
          })
          .from(featuredCakes)
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(sql`LOWER(${featuredCakes.name}) LIKE LOWER(${searchPattern})`)
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else {
        const [{ count: untaggedCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(featuredCakes);

        total = Number(untaggedCount);

        allCakesResult = await db
          .select({
            cake: featuredCakes,
            tagName: tags.name,
          })
          .from(featuredCakes)
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      }

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved cakes: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allCakesResult.map((item) =>
            this.mapToCakeResponse(item.cake, item.tagName, item.price),
          ),
          total,
          page,
          limit,
          totalPages,
        },
        'Cakes retrieved successfully',
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve cakes: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to retrieve cakes', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findOne(id: string) {
    try {
      const cakeResult = await db
        .select({
          cake: featuredCakes,
          tagName: tags.name,
        })
        .from(featuredCakes)
        .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
        .where(eq(featuredCakes.id, id))
        .limit(1);

      if (!cakeResult.length) {
        this.logger.warn(`Cake not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const { cake, tagName } = cakeResult[0];

      this.logger.debug(`Retrieved cake: ${id}`);
      return successResponse(this.mapToCakeResponse(cake, tagName), 'Cake retrieved successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to retrieve cake', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async update(id: string, updateFeaturedCakeDto: UpdateFeaturedCakeDto) {
    try {
      // Check if cake exists
      const [existingCake] = await db
        .select()
        .from(featuredCakes)
        .where(eq(featuredCakes.id, id))
        .limit(1);

      if (!existingCake) {
        this.logger.warn(`Cake not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      if (updateFeaturedCakeDto.tagId) {
        await this.validateTagExists(updateFeaturedCakeDto.tagId);
      }

      const updateData: Record<string, unknown> = Object.fromEntries(
        Object.entries(updateFeaturedCakeDto).filter(([, value]) => value !== undefined),
      );

      updateData.updatedAt = new Date();

      const [updatedCake] = await db
        .update(featuredCakes)
        .set(updateData)
        .where(eq(featuredCakes.id, id))
        .returning();

      this.logger.log(`Cake updated: ${id}`);

      // Fetch tag name if tagId exists
      let tagName: string;
      if (updatedCake.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedCake.tagId))
          .limit(1);
        tagName = tagResult[0]?.name || '';
      } else {
        tagName = '';
      }

      return successResponse(
        this.mapToCakeResponse(updatedCake, tagName),
        'Cake updated successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = this.getErrorMessage(error);
      this.logger.error(`Failed to update cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to update cake', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async remove(id: string) {
    try {
      const [cake] = await db.select().from(featuredCakes).where(eq(featuredCakes.id, id)).limit(1);

      if (!cake) {
        this.logger.warn(`Cake not found for deletion: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      await db.delete(featuredCakes).where(eq(featuredCakes.id, id));

      this.logger.log(`Cake deleted: ${id}`);

      return successResponse({ message: 'Cake deleted successfully' }, 'Cake deleted successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to delete cake', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async toggleStatus(id: string) {
    try {
      const [existingCake] = await db
        .select()
        .from(featuredCakes)
        .where(eq(featuredCakes.id, id))
        .limit(1);

      if (!existingCake) {
        this.logger.warn(`Cake not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [updatedCake] = await db
        .update(featuredCakes)
        .set({
          isActive: !existingCake.isActive,
          updatedAt: new Date(),
        })
        .where(eq(featuredCakes.id, id))
        .returning();

      const statusText = updatedCake.isActive ? 'activated' : 'deactivated';
      this.logger.log(`Cake status toggled (${statusText}): ${id}`);

      let tagName: string;
      if (updatedCake.tagId) {
        const tagResult = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updatedCake.tagId))
          .limit(1);
        tagName = tagResult[0]?.name || '';
      } else {
        tagName = '';
      }

      return successResponse(
        this.mapToCakeResponse(updatedCake, tagName),
        `Cake ${statusText} successfully`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to toggle cake status: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to toggle cake status', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  /**
   * Validate that a featured cake exists by ID
   */
  private async validateCakeExists(cakeId: string): Promise<void> {
    const cakeResult = await db
      .select({ id: featuredCakes.id })
      .from(featuredCakes)
      .where(eq(featuredCakes.id, cakeId))
      .limit(1);

    if (cakeResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `Featured cake with ID ${cakeId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  /**
   * Validate that a region exists by ID
   */
  private async validateRegionExists(regionId: string): Promise<void> {
    const regionResult = await db
      .select({ id: regions.id })
      .from(regions)
      .where(eq(regions.id, regionId))
      .limit(1);

    if (regionResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `Region with ID ${regionId} not found`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  async createRegionItemPrice(createRegionItemPriceDto: CreateRegionItemPriceDto) {
    const { featuredCakeId, regionId, price } = createRegionItemPriceDto;

    try {
      // Validate both IDs exist
      await this.validateCakeExists(featuredCakeId);
      await this.validateRegionExists(regionId);

      // Check if pricing already exists for this cake and region
      const existingPrice = await db
        .select()
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.featuredCakeId, featuredCakeId),
            eq(regionItemPrices.regionId, regionId),
          ),
        )
        .limit(1);

      let regionItemPrice: typeof regionItemPrices.$inferSelect;
      if (existingPrice.length > 0) {
        const [updated] = await db
          .update(regionItemPrices)
          .set({
            price,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(regionItemPrices.featuredCakeId, featuredCakeId),
              eq(regionItemPrices.regionId, regionId),
            ),
          )
          .returning();
        regionItemPrice = updated;
        this.logger.log(`Region pricing updated: cake ${featuredCakeId}, region ${regionId}`);
      } else {
        const [created] = await db
          .insert(regionItemPrices)
          .values({
            featuredCakeId,
            regionId,
            price,
          })
          .returning();
        regionItemPrice = created;
        this.logger.log(`Region pricing created: cake ${featuredCakeId}, region ${regionId}`);
      }

      return successResponse(
        {
          featuredCakeId: regionItemPrice.featuredCakeId,
          regionId: regionItemPrice.regionId,
          price: regionItemPrice.price,
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
      const errorMsg = this.getErrorMessage(error);
      this.logger.error(`Failed to create region pricing: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to create region pricing', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  private mapToCakeResponse(
    cake: typeof featuredCakes.$inferSelect,
    tagName?: string,
    price?: string,
  ) {
    const response: Record<string, unknown> = {
      id: cake.id,
      name: cake.name,
      description: cake.description,
      images: cake.images,
      flavorList: cake.flavorList,
      pipingPaletteList: cake.pipingPaletteList,
      tagId: cake.tagId,
      tagName: tagName || null,
      capacity: cake.capacity,
      isActive: cake.isActive,
      createdAt: cake.createdAt,
      updatedAt: cake.updatedAt,
    };

    if (price !== undefined) {
      response.price = price;
    }

    return response;
  }
}
