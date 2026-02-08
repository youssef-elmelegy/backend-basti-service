import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@/db';
import { sliderImages } from '@/db/schema';
import { SliderImageResponseDto, SliderImageItemDto } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { eq } from 'drizzle-orm';

@Injectable()
export class SliderImageService {
  private readonly logger = new Logger(SliderImageService.name);

  /**
   * Get all slider images
   */
  async findAll(): Promise<SuccessResponse<SliderImageResponseDto[]>> {
    try {
      const images = await db.select().from(sliderImages);

      this.logger.log(`Retrieved ${images.length} slider images`);

      return successResponse(images, 'Slider images retrieved successfully', HttpStatus.OK);
    } catch (error) {
      this.logger.error('Failed to retrieve slider images', error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve slider images',
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

      const imagesToInsert = images.map((item) => ({
        title: item.title,
        imageUrl: item.imageUrl,
      }));

      const insertedImages = await db.insert(sliderImages).values(imagesToInsert).returning();

      this.logger.log(`Inserted ${insertedImages.length} new slider images in bulk`);

      return successResponse(insertedImages, 'Slider images updated successfully', HttpStatus.OK);
    } catch (error) {
      this.logger.error('Failed to update slider images', error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update slider images',
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
          errorResponse('Slider image not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      await db.delete(sliderImages).where(eq(sliderImages.id, id));

      this.logger.log(`Deleted slider image: ${id}`);

      return successResponse(
        { message: 'Slider image deleted successfully' },
        'Slider image deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete slider image: ${id}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete slider image',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
