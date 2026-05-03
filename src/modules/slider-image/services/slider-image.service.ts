import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@/db';
import { sliderImages, tags } from '@/db/schema';
import { SliderImageWithTagsResponseDto, SliderImageResponseDto, SliderImageItemDto } from '../dto';
import { TagDto } from '@/modules/tags/dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { eq, getTableColumns } from 'drizzle-orm';
import { TranslationService } from '@/common/translation/translation.service';

@Injectable()
export class SliderImageService {
  private readonly logger = new Logger(SliderImageService.name);

  constructor(private readonly translationService: TranslationService) {}

  /**
   * Get all slider images with tags matching the same display order
   */
  async findAll(): Promise<SuccessResponse<SliderImageWithTagsResponseDto[]>> {
    try {
      const rows = await db
        .select({
          id: sliderImages.id,
          title: this.translationService.getLocalized(sliderImages.title, 'title'),
          imageUrl: sliderImages.imageUrl,
          displayOrder: sliderImages.displayOrder,
          createdAt: sliderImages.createdAt,
          tagId: tags.id,
          tagTypes: tags.types,
          tagName: this.translationService.getLocalized(tags.name, 'name'),
          tagDisplayOrder: tags.displayOrder,
          tagCreatedAt: tags.createdAt,
          tagUpdatedAt: tags.updatedAt,
        })
        .from(sliderImages)
        .leftJoin(tags, eq(sliderImages.displayOrder, tags.displayOrder))
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
   * Update slider images - deletes all existing ones and creates new ones in bulk
   */
  async update(images: SliderImageItemDto[]): Promise<SuccessResponse<SliderImageResponseDto[]>> {
    try {
      await db.delete(sliderImages);

      this.logger.log('Deleted all existing slider images');

      const imagesToInsert: any[] = [];

      for (const image of images) {
        const imageObject = await this.translationService.getTranslationObject(image.title);
        imagesToInsert.push({
          title: imageObject,
          imageUrl: image.imageUrl,
          displayOrder: image.displayOrder,
        });
      }

      const insertedImages = await db
        .insert(sliderImages)
        .values(imagesToInsert)
        .returning({
          ...getTableColumns(sliderImages),
          title: this.translationService.getLocalized(sliderImages.title, 'title'),
        });

      this.logger.log(`Inserted ${insertedImages.length} new slider images in bulk`);

      return successResponse(insertedImages, 'routes.slider.images_updated', HttpStatus.OK);
    } catch (error) {
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
