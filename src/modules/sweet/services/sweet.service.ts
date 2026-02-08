import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSweetDto,
  UpdateSweetDto,
  GetSweetsQueryDto,
  SweetDataDto,
  GetAllSweetsDataDto,
  DeleteSweetResponseDto,
} from '../dto';
import { db } from '@/db';
import { sweets, tags } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class SweetService {
  private readonly logger = new Logger(SweetService.name);

  async create(createDto: CreateSweetDto): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const [newSweet] = await db
        .insert(sweets)
        .values({
          name: createDto.name,
          description: createDto.description,
          images: createDto.images,
          sizes: createDto.sizes,
          tagId: createDto.tagId,
          isActive: createDto.isActive ?? true,
        })
        .returning();

      let tagName: string;
      if (newSweet.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, newSweet.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet created: ${newSweet.id}`);
      return successResponse(
        this.mapToSweetResponse(newSweet, tagName),
        'Sweet created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(query: GetSweetsQueryDto): Promise<SuccessResponse<GetAllSweetsDataDto>> {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;

      const allSweets = await db
        .select({
          sweet: sweets,
          tag: {
            id: tags.id,
            tagName: tags.name,
          },
        })
        .from(sweets)
        .leftJoin(tags, eq(sweets.tagId, tags.id))
        .orderBy(sortOrder(sweets.createdAt))
        .limit(query.limit)
        .offset(offset);

      const [{ count: total }] = await db.select({ count: db.$count(sweets) }).from(sweets);

      const totalPages = Math.ceil(total / query.limit);

      return successResponse(
        {
          items: allSweets.map((row) => this.mapToSweetResponse(row.sweet, row.tag?.tagName)),
          pagination: {
            total,
            totalPages,
            page: query.page,
            limit: query.limit,
          },
        },
        'Sweets retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve sweets: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve sweets',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const result = await db
        .select({
          sweet: sweets,
          tag: {
            id: tags.id,
            tagName: tags.name,
          },
        })
        .from(sweets)
        .leftJoin(tags, eq(sweets.tagId, tags.id))
        .where(eq(sweets.id, id))
        .limit(1);

      const item = result[0];

      if (!item) {
        this.logger.warn(`Sweet not found: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      return successResponse(
        this.mapToSweetResponse(item.sweet, item.tag?.tagName),
        'Sweet retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve sweet ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(id: string, updateDto: UpdateSweetDto): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const [updated] = await db
        .update(sweets)
        .set({
          name: updateDto.name,
          description: updateDto.description,
          images: updateDto.images,
          sizes: updateDto.sizes,
          tagId: updateDto.tagId,
          isActive: updateDto.isActive,
          updatedAt: new Date(),
        })
        .where(eq(sweets.id, id))
        .returning();

      if (!updated) {
        this.logger.warn(`Sweet not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      let tagName: string;
      if (updated.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updated.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet updated: ${id}`);
      return successResponse(
        this.mapToSweetResponse(updated, tagName),
        'Sweet updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<DeleteSweetResponseDto>> {
    try {
      const [deleted] = await db.delete(sweets).where(eq(sweets.id, id)).returning();

      if (!deleted) {
        this.logger.warn(`Sweet not found for deletion: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      this.logger.log(`Sweet deleted: ${id}`);
      return successResponse(
        { message: 'Sweet deleted successfully' },
        'Sweet deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet deletion error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete sweet',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async toggleStatus(id: string): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const [existing] = await db.select().from(sweets).where(eq(sweets.id, id)).limit(1);

      if (!existing) {
        this.logger.warn(`Sweet not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('Sweet not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [updated] = await db
        .update(sweets)
        .set({
          isActive: !existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(sweets.id, id))
        .returning();

      let tagName: string;
      if (updated.tagId) {
        const [tag] = await db
          .select({ name: tags.name })
          .from(tags)
          .where(eq(tags.id, updated.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet status toggled: ${id}`);
      return successResponse(
        this.mapToSweetResponse(updated, tagName),
        'Sweet status toggled successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet status toggle error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to toggle sweet status',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private mapToSweetResponse(sweet: typeof sweets.$inferSelect, tagName?: string) {
    return {
      id: sweet.id,
      name: sweet.name,
      description: sweet.description,
      tagId: sweet.tagId,
      tagName: tagName || undefined,
      images: sweet.images,
      sizes: sweet.sizes,
      isActive: sweet.isActive,
      createdAt: sweet.createdAt,
      updatedAt: sweet.updatedAt,
    };
  }
}
