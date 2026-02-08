import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { featuredCakes, tags } from '@/db/schema';
import { eq, desc, sql, asc } from 'drizzle-orm';
import { CreateFeaturedCakeDto, UpdateFeaturedCakeDto, GetFeaturedCakesQueryDto } from '../dto';
import { errorResponse, successResponse } from '@/utils';

@Injectable()
export class FeaturedCakeService {
  private readonly logger = new Logger(FeaturedCakeService.name);

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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to create cake', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findAll(query: GetFeaturedCakesQueryDto) {
    const { page, limit, tag, order, sort } = query;

    try {
      const offset = (page - 1) * limit;
      const sortOrder = order === 'desc' ? desc : asc;
      const sortColumn = sort === 'alpha' ? featuredCakes.name : featuredCakes.createdAt;

      let allCakesResult: Array<{ cake: typeof featuredCakes.$inferSelect; tagName: string }> = [];
      let total = 0;

      // If filtering by tag, use joined query; otherwise use simple query
      if (tag) {
        const [{ count: tagCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${featuredCakes.id})` })
          .from(featuredCakes)
          .innerJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(eq(tags.name, tag));

        total = tagCount;

        allCakesResult = await db
          .select({
            cake: featuredCakes,
            tagName: tags.name,
          })
          .from(featuredCakes)
          .innerJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(eq(tags.name, tag))
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else {
        const [{ count: untaggedCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(featuredCakes);

        total = untaggedCount;

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
          items: allCakesResult.map((item) => this.mapToCakeResponse(item.cake, item.tagName)),
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to update cake', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async remove(id: string) {
    try {
      // Check if cake exists
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
      // Check if cake exists
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

  private mapToCakeResponse(cake: typeof featuredCakes.$inferSelect, tagName?: string) {
    return {
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
  }
}
