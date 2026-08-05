import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '@/db';
import { sliderImages, tags } from '@/db/schema';
import { SliderImageWithTagsResponseDto, SliderImageResponseDto, SliderImageItemDto } from '../dto';
import { TagDto } from '@/modules/tags/dto';
import { errorResponse, successResponse, SuccessResponse, validateTagExists } from '@/utils';
import { eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { TranslationService } from '@/common/translation/translation.service';

@Injectable()
export class SliderImageService {
  private readonly logger = new Logger(SliderImageService.name);

  constructor(private readonly translationService: TranslationService) {}

  /**
   * Get all slider images with tags matching the same display order
   */
  async findAll(includeHidden = false): Promise<SuccessResponse<SliderImageWithTagsResponseDto[]>> {
    try {
      const rows = await db
        .select({
          id: sliderImages.id,
          title: this.translationService.getLocalized(sliderImages.title, 'title'),
          imageUrl: sliderImages.imageUrl,
          displayOrder: sliderImages.displayOrder,
          isHidden: sliderImages.isHidden,
          createdAt: sliderImages.createdAt,
          tagId: tags.id,
          tagTypes: tags.types,
          tagName: this.translationService.getLocalized(tags.name, 'name'),
          tagDisplayOrder: tags.displayOrder,
          tagCreatedAt: tags.createdAt,
          tagUpdatedAt: tags.updatedAt,
        })
        .from(sliderImages)
        // Joined on the real FK. This used to match on equal display_order, which
        // silently reassigned tags whenever either side was reordered.
        .leftJoin(tags, eq(sliderImages.tagId, tags.id))
        .where(includeHidden ? undefined : eq(sliderImages.isHidden, false))
        .orderBy(sliderImages.displayOrder);

      const imageMap = new Map<string, Omit<SliderImageWithTagsResponseDto, 'tags'>>();
      const tagsMap = new Map<string, TagDto[]>();

      for (const row of rows) {
        if (!imageMap.has(row.id)) {
          imageMap.set(row.id, {
            id: row.id,
            title: row.title,
            imageUrl: row.imageUrl,
            displayOrder: row.displayOrder,
            tagId: row.tagId,
            isHidden: row.isHidden,
            createdAt: row.createdAt,
          });
          tagsMap.set(row.id, []);
        }
        if (row.tagId) {
          const tag: TagDto = {
            id: row.tagId,
            name: row.tagName ?? '',
            types: row.tagTypes ?? [],
            displayOrder: row.tagDisplayOrder ?? 0,
            createdAt: row.tagCreatedAt ?? new Date(),
            updatedAt: row.tagUpdatedAt ?? new Date(),
          };
          tagsMap.get(row.id)?.push(tag);
        }
      }

      const images: SliderImageWithTagsResponseDto[] = Array.from(imageMap.entries()).map(
        ([id, image]) => ({ ...image, tags: tagsMap.get(id) ?? [] }),
      );

      this.logger.log(`Retrieved ${images.length} slider images`);

      return successResponse(images, 'routes.slider.images_retrieved', HttpStatus.OK);
    } catch (error) {
      this.logger.error('Failed to retrieve slider images', error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.slider.images_failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Replace the slider set with the supplied list.
   *
   * Rows carrying an `id` are updated in place rather than recreated: this used
   * to delete every row and re-insert, which minted new ids and wiped the
   * `isHidden` flag on every unrelated save. Rows absent from the payload are
   * deleted, so the endpoint still expresses the full desired state.
   */
  async update(images: SliderImageItemDto[]): Promise<SuccessResponse<SliderImageResponseDto[]>> {
    try {
      // Reject duplicate tags up front — display_order is unique and a tag is
      // meant to front exactly one slider.
      const suppliedTagIds = images.map((image) => image.tagId).filter(Boolean);
      if (new Set(suppliedTagIds).size !== suppliedTagIds.length) {
        throw new BadRequestException(
          errorResponse(
            'routes.slider.duplicate_tag',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      for (const tagId of suppliedTagIds) {
        await validateTagExists(tagId);
      }

      const result = await db.transaction(async (tx) => {
        const existing = await tx.select({ id: sliderImages.id }).from(sliderImages);
        const existingIds = new Set(existing.map((row) => row.id));

        const keptIds = images
          .map((image) => image.id)
          .filter((id): id is string => Boolean(id) && existingIds.has(id));

        // Drop rows the admin removed from the list.
        const removedIds = [...existingIds].filter((id) => !keptIds.includes(id));
        if (removedIds.length > 0) {
          await tx.delete(sliderImages).where(inArray(sliderImages.id, removedIds));
        }

        // display_order is UNIQUE, so shift everything clear before reassigning
        // to avoid transient collisions while rows swap positions.
        if (keptIds.length > 0) {
          await tx
            .update(sliderImages)
            .set({ displayOrder: sql`${sliderImages.displayOrder} + 100000` })
            .where(inArray(sliderImages.id, keptIds));
        }

        for (const image of images) {
          const titleObject = await this.translationService.getTranslationObject(image.title);
          const tagId = image.tagId ?? null;

          if (image.id && existingIds.has(image.id)) {
            await tx
              .update(sliderImages)
              .set({
                title: titleObject,
                imageUrl: image.imageUrl,
                displayOrder: image.displayOrder,
                tagId,
                // Attaching a tag is the only way out of the hidden state; an
                // image left without one keeps whatever flag it already had.
                ...(tagId ? { isHidden: false } : {}),
              })
              .where(eq(sliderImages.id, image.id));
          } else {
            await tx.insert(sliderImages).values({
              title: titleObject,
              imageUrl: image.imageUrl,
              displayOrder: image.displayOrder,
              tagId,
            });
          }
        }

        return tx
          .select({
            ...getTableColumns(sliderImages),
            title: this.translationService.getLocalized(sliderImages.title, 'title'),
          })
          .from(sliderImages)
          .orderBy(sliderImages.displayOrder);
      });

      this.logger.log(`Slider images updated: ${result.length} rows`);

      return successResponse(result, 'routes.slider.images_updated', HttpStatus.OK);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to update slider images', error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.slider.images_failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Delete slider image by ID
   */
  async remove(id: string): Promise<SuccessResponse<{ message: string }>> {
    try {
      const [existingImage] = await db
        .select()
        .from(sliderImages)
        .where(eq(sliderImages.id, id))
        .limit(1);

      if (!existingImage) {
        this.logger.warn(`Slider image not found: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.slider.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(sliderImages).where(eq(sliderImages.id, id));

      this.logger.log(`Deleted slider image: ${id}`);

      return successResponse(
        { message: 'routes.slider.image_deleted' },
        'routes.slider.image_deleted',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete slider image: ${id}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.slider.image_failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
