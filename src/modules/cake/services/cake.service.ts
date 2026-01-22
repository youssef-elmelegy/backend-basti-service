import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { cakes } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { CreateCakeDto, UpdateCakeDto, PaginationDto } from '../dto';
import { errorResponse, successResponse } from '@/utils';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';

@Injectable()
export class CakeService {
  private readonly logger = new Logger(CakeService.name);

  async create(createCakeDto: CreateCakeDto) {
    const {
      name,
      description,
      images,
      mainPrice,
      capacity,
      tags,
      flavors,
      sizes,
      isActive = true,
    } = createCakeDto;

    try {
      const [newCake] = await db
        .insert(cakes)
        .values({
          name,
          description,
          images,
          mainPrice: mainPrice.toString(),
          capacity,
          tags,
          flavors,
          sizes: sizes as Array<{ size: string; price: number }>,
          isActive,
        })
        .returning();

      this.logger.log(`Cake created: ${newCake.id} (${name})`);

      return successResponse(
        this.mapToCakeResponse(newCake),
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

  async findAll(paginationDto: PaginationDto) {
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT } = paginationDto;

    try {
      const offset = (page - 1) * limit;

      // Get total count
      const [{ count: total }] = await db.select({ count: sql<number>`COUNT(*)` }).from(cakes);

      // Get paginated cakes
      const allCakes = await db
        .select()
        .from(cakes)
        .orderBy(desc(cakes.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved cakes: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allCakes.map((cake) => this.mapToCakeResponse(cake)),
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
      const [cake] = await db.select().from(cakes).where(eq(cakes.id, id)).limit(1);

      if (!cake) {
        this.logger.warn(`Cake not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      this.logger.debug(`Retrieved cake: ${id}`);
      return successResponse(this.mapToCakeResponse(cake), 'Cake retrieved successfully');
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

  async update(id: string, updateCakeDto: UpdateCakeDto) {
    try {
      // Check if cake exists
      const [existingCake] = await db.select().from(cakes).where(eq(cakes.id, id)).limit(1);

      if (!existingCake) {
        this.logger.warn(`Cake not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const updateData: Record<string, unknown> = Object.fromEntries(
        Object.entries(updateCakeDto).filter(([, value]) => value !== undefined),
      );

      if (updateData.mainPrice !== undefined) {
        updateData.mainPrice = (updateData.mainPrice as number).toString();
      }

      updateData.updatedAt = new Date();

      const [updatedCake] = await db
        .update(cakes)
        .set(updateData)
        .where(eq(cakes.id, id))
        .returning();

      this.logger.log(`Cake updated: ${id}`);

      return successResponse(this.mapToCakeResponse(updatedCake), 'Cake updated successfully');
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
      const [cake] = await db.select().from(cakes).where(eq(cakes.id, id)).limit(1);

      if (!cake) {
        this.logger.warn(`Cake not found for deletion: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      await db.delete(cakes).where(eq(cakes.id, id));

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
      const [existingCake] = await db.select().from(cakes).where(eq(cakes.id, id)).limit(1);

      if (!existingCake) {
        this.logger.warn(`Cake not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('Cake not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [updatedCake] = await db
        .update(cakes)
        .set({
          isActive: !existingCake.isActive,
          updatedAt: new Date(),
        })
        .where(eq(cakes.id, id))
        .returning();

      const statusText = updatedCake.isActive ? 'activated' : 'deactivated';
      this.logger.log(`Cake status toggled (${statusText}): ${id}`);

      return successResponse(
        this.mapToCakeResponse(updatedCake),
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

  private mapToCakeResponse(cake: typeof cakes.$inferSelect) {
    return {
      id: cake.id,
      name: cake.name,
      description: cake.description,
      images: cake.images,
      flavors: cake.flavors,
      sizes: cake.sizes as Array<{ size: string; price: number }>,
      mainPrice: parseFloat(cake.mainPrice),
      tags: cake.tags,
      capacity: cake.capacity,
      isActive: cake.isActive,
      createdAt: cake.createdAt,
      updatedAt: cake.updatedAt,
    };
  }
}
