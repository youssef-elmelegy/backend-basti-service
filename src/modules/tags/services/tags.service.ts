import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { TagDto, CreateTagDto, UpdateTagDto } from '../dto';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

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
   * Get all tags from the tags table, ordered by display_order
   */
  async findAll(): Promise<SuccessResponse<TagDto[]>> {
    try {
      const allTags = await db.select().from(tags).orderBy(asc(tags.displayOrder));

      this.logger.log(`Retrieved ${allTags.length} tags`);

      return successResponse(allTags, 'Tags retrieved successfully', HttpStatus.OK);
    } catch (error) {
      this.logger.error('Failed to retrieve tags', error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve tags',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Create a new tag
   */
  async create(createTagDto: CreateTagDto): Promise<SuccessResponse<TagDto>> {
    try {
      const tagName: string = createTagDto.name;
      const displayOrderValue: number = createTagDto.displayOrder;
      const tagNameLower: string = tagName.toLowerCase();

      const existingTag = await db.select().from(tags).where(eq(tags.name, tagNameLower)).limit(1);

      if (existingTag.length > 0) {
        throw new BadRequestException(
          errorResponse('Tag name already exists', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      const existingDisplayOrder = await db
        .select()
        .from(tags)
        .where(eq(tags.displayOrder, displayOrderValue))
        .limit(1);

      if (existingDisplayOrder.length > 0) {
        throw new BadRequestException(
          errorResponse(
            'Display order already exists',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [newTag] = await db
        .insert(tags)
        .values({
          name: tagNameLower,
          displayOrder: displayOrderValue,
        })
        .returning();

      this.logger.log(`Tag created: ${newTag.id} (${newTag.name})`);

      return successResponse(newTag, 'Tag created successfully', HttpStatus.CREATED);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Tag creation error: ${this.getErrorMessage(error)}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create tag',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Update a new tag
   */
  async update(editTagDto: UpdateTagDto, id: string): Promise<SuccessResponse<TagDto>> {
    try {
      if (!editTagDto.name && editTagDto.displayOrder === undefined) {
        throw new BadRequestException(
          errorResponse(
            'At least one field (name or displayOrder) must be provided for update',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [selectedTag] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);

      if (!selectedTag) {
        throw new NotFoundException(
          errorResponse('Tag not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      if (editTagDto.name && selectedTag.name === editTagDto.name.toLowerCase()) {
        throw new BadRequestException(
          errorResponse(
            'No changes detected. Please provide a different name to update.',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      if (editTagDto.displayOrder && selectedTag.displayOrder === editTagDto.displayOrder) {
        throw new BadRequestException(
          errorResponse(
            'No changes detected. Please provide a different display order to update.',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [existingTagName] = await db
        .select()
        .from(tags)
        .where(eq(tags.name, editTagDto.name))
        .limit(1);

      if (existingTagName) {
        throw new BadRequestException(
          errorResponse('Tag name already exists', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      const [existingDisplayOrder] = await db
        .select()
        .from(tags)
        .where(eq(tags.displayOrder, editTagDto.displayOrder))
        .limit(1);

      if (existingDisplayOrder) {
        throw new BadRequestException(
          errorResponse(
            'Display order already exists',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [updatedTag] = await db
        .update(tags)
        .set({
          ...(editTagDto.name && { name: editTagDto.name.toLowerCase() }),
          ...(editTagDto.displayOrder !== undefined && { displayOrder: editTagDto.displayOrder }),
          updatedAt: new Date(),
        })
        .where(eq(tags.id, id))
        .returning();

      this.logger.log(`Tag updated: ${updatedTag.id} (${updatedTag.name})`);

      return successResponse(updatedTag, 'Tag updated successfully', HttpStatus.OK);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Tag update error: ${this.getErrorMessage(error)}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update tag',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Delete a tag by ID
   */
  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    try {
      const tag = await db.select().from(tags).where(eq(tags.id, id)).limit(1);

      if (tag.length === 0) {
        throw new NotFoundException(
          errorResponse('Tag not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(tags).where(eq(tags.id, id));

      this.logger.log(`Tag deleted: ${id}`);

      return successResponse(
        { message: 'Tag deleted successfully' },
        'Tag deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Tag deletion error: ${this.getErrorMessage(error)}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete tag',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
