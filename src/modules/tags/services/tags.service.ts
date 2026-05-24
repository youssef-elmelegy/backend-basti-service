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
import { asc, eq, and, lt, gt, gte, lte, sql, getTableColumns } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { TagDto, CreateTagDto, UpdateTagDto, FindAllQueryDto } from '../dto';
import { TranslationService } from '@/common/translation/translation.service';
import { getErrorMessage } from '@/utils';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly translationService: TranslationService) {}

  /**
   * Get all tags from the tags table, ordered by display_order
   */
  async findAll(query: FindAllQueryDto): Promise<SuccessResponse<TagDto[]>> {
    try {
      let allTags = await db
        .select({
          ...getTableColumns(tags),
          name: this.translationService.getLocalized(tags.name, 'name'),
        })
        .from(tags)
        .orderBy(asc(tags.displayOrder));

      if (query.type && query.type.trim() !== '') {
        const typeLower = query.type.toLowerCase();
        allTags = allTags.filter((tag) => tag.types.includes(typeLower));
      }

      this.logger.log(`Retrieved ${allTags.length} tags`);

      return successResponse(allTags, 'routes.tags.list_retrieved', HttpStatus.OK);
    } catch (error) {
      this.logger.error('Failed to retrieve tags', error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.tags.failed_list',
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
      const tagTypes: string[] = createTagDto.types;

      const existingTag = await db
        .select({
          ...getTableColumns(tags),
          name: this.translationService.getLocalized(tags.name, 'name'),
        })
        .from(tags)
        .where(eq(this.translationService.getLocalized(tags.name, null, 'en'), tagNameLower))
        .limit(1);

      if (existingTag.length > 0) {
        throw new BadRequestException(
          errorResponse('routes.tags.name_exists', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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
            'routes.tags.display_order_exists',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const nameObject = await this.translationService.getTranslationObject(tagName);

      nameObject.en = nameObject.en.toLowerCase();

      const [newTag] = await db
        .insert(tags)
        .values({
          name: nameObject,
          displayOrder: displayOrderValue,
          types: tagTypes,
        })
        .returning({
          ...getTableColumns(tags),
          name: this.translationService.getLocalized(tags.name, 'name'),
        });

      this.logger.log(
        `Tag created: ${newTag.id} (${newTag.name}) with types ${newTag.types.join(', ')}`,
      );

      return successResponse(newTag, 'routes.tags.created', HttpStatus.CREATED);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Tag creation error: ${getErrorMessage(error)}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.tags.failed_create',
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
      if (
        !editTagDto.name &&
        editTagDto.displayOrder === undefined &&
        (editTagDto.types === undefined || editTagDto.types.length === 0)
      ) {
        throw new BadRequestException(
          errorResponse(
            'routes.tags.no_fields_to_update',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [selectedTag] = await db
        .select({
          ...getTableColumns(tags),
          name: this.translationService.getLocalized(tags.name, 'name'),
        })
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1);

      if (!selectedTag) {
        throw new NotFoundException(
          errorResponse('routes.tags.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const updateData: {
        name?: Awaited<ReturnType<TranslationService['getTranslationObject']>>;
        displayOrder?: number;
        types?: string[];
      } = {};

      if (editTagDto.name) {
        const nameObject = await this.translationService.getTranslationObject(editTagDto.name);
        nameObject.en = nameObject.en.toLowerCase();
        updateData.name = nameObject;
      }
      if (editTagDto.displayOrder !== undefined) updateData.displayOrder = editTagDto.displayOrder;
      if (editTagDto.types !== undefined) {
        updateData.types = editTagDto.types.map((type) => type.toLowerCase());
      }

      // If nothing would change, reject
      if (
        updateData.name === selectedTag.name &&
        updateData.displayOrder === selectedTag.displayOrder &&
        (updateData.types?.length ?? 0) === 0
      ) {
        throw new BadRequestException(
          errorResponse(
            'routes.tags.no_fields_to_update',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [existingTagName] = await db
        .select({
          ...getTableColumns(tags),
          name: this.translationService.getLocalized(tags.name, 'name'),
        })
        .from(tags)
        .where(eq(this.translationService.getLocalized(tags.name, null, 'en'), updateData.name))
        .limit(1);

      if (existingTagName && existingTagName.id !== id) {
        throw new BadRequestException(
          errorResponse('routes.tags.name_exists', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      // Ensure displayOrder uniqueness excluding current record
      const [existingDisplayOrder] = await db
        .select()
        .from(tags)
        .where(eq(tags.displayOrder, updateData.displayOrder))
        .limit(1);

      if (existingDisplayOrder && existingDisplayOrder.id !== id) {
        throw new BadRequestException(
          errorResponse(
            'routes.tags.display_order_exists',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [updatedTag] = await db
        .update(tags)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(tags.id, id))
        .returning({
          ...getTableColumns(tags),
          name: this.translationService.getLocalized(tags.name, 'name'),
        });

      this.logger.log(`Tag updated: ${updatedTag.id} (${updatedTag.name})`);

      return successResponse(updatedTag, 'routes.tags.updated', HttpStatus.OK);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Tag update error: ${getErrorMessage(error)}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.tags.failed_update',
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
          errorResponse('routes.tags.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(tags).where(eq(tags.id, id));

      this.logger.log(`Tag deleted: ${id}`);

      return successResponse(
        { message: 'routes.tags.deleted' },
        'routes.tags.deleted',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Tag deletion error: ${getErrorMessage(error)}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.tags.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Change tag display order
   */
  async changeTagOrder(id: string, newOrder: number): Promise<SuccessResponse<TagDto[]>> {
    // Get the tag to update
    const [tag] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);

    if (!tag) {
      this.logger.warn(`Tag order change failed: Tag not found - ${id}`);
      throw new NotFoundException(
        errorResponse('routes.tags.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Get total count of tags to validate the new order
    const totalTags = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(tags);

    const totalCount = Number(totalTags[0]?.count) || 0;

    // Validate new order is within valid range
    if (newOrder < 1 || newOrder > totalCount) {
      this.logger.warn(
        `Tag order change failed: Invalid order position - ${newOrder} (valid range: 1-${totalCount})`,
      );
      throw new BadRequestException(
        errorResponse(
          `routes.tags.invalid_display_order_range`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { max: totalCount },
        ),
      );
    }

    try {
      const currentOrder = tag.displayOrder;
      const now = new Date();

      if (currentOrder !== newOrder) {
        if (newOrder < currentOrder) {
          // Moving up: tags from newOrder to currentOrder-1 shift down by 1
          await db.transaction(async (tx) => {
            // Update tags that need to shift down (move them out of the way first with +100000)
            await tx
              .update(tags)
              .set({
                displayOrder: sql`${tags.displayOrder} + 100000`,
                updatedAt: now,
              })
              .where(and(gte(tags.displayOrder, newOrder), lt(tags.displayOrder, currentOrder)));

            // Now move them from temp positions to final positions (shifted down by 1)
            await tx
              .update(tags)
              .set({
                displayOrder: sql`${tags.displayOrder} - 100000 + 1`,
                updatedAt: now,
              })
              .where(
                and(
                  gte(tags.displayOrder, newOrder + 100000),
                  lt(tags.displayOrder, currentOrder + 100000),
                ),
              );

            // Move target tag to newOrder
            await tx
              .update(tags)
              .set({
                displayOrder: newOrder,
                updatedAt: now,
              })
              .where(eq(tags.id, id));
          });
        } else {
          // Moving down: tags from currentOrder+1 to newOrder shift up by -1
          await db.transaction(async (tx) => {
            // Update tags that need to shift up (move them out of the way first with +100000)
            await tx
              .update(tags)
              .set({
                displayOrder: sql`${tags.displayOrder} + 100000`,
                updatedAt: now,
              })
              .where(and(gt(tags.displayOrder, currentOrder), lte(tags.displayOrder, newOrder)));

            // Now move them from temp positions to final positions (shifted up by -1)
            await tx
              .update(tags)
              .set({
                displayOrder: sql`${tags.displayOrder} - 100000 - 1`,
                updatedAt: now,
              })
              .where(
                and(
                  gt(tags.displayOrder, currentOrder + 100000),
                  lte(tags.displayOrder, newOrder + 100000),
                ),
              );

            // Move target tag to newOrder
            await tx
              .update(tags)
              .set({
                displayOrder: newOrder,
                updatedAt: now,
              })
              .where(eq(tags.id, id));
          });
        }
      }

      const updatedTags = await db
        .select({
          ...getTableColumns(tags),
          name: this.translationService.getLocalized(tags.name, 'name'),
        })
        .from(tags)
        .orderBy(asc(tags.displayOrder));

      this.logger.log(`Tag order changed: ${id} moved from order ${currentOrder} to ${newOrder}`);

      return successResponse(updatedTags, 'routes.tags.order_updated', HttpStatus.OK);
    } catch (error) {
      this.logger.error(`Tag order change error: ${getErrorMessage(error)}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.tags.failed_change_order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
