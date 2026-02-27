/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { CloudinaryService } from '@/common/services/cloudinary.service';
import { UploadImageDecorator, DeleteImagesDecorator } from './decorators/upload.decorator';
import { FlexibleJwtGuard } from '@/common/guards/flexible-jwt.guard';
import { successResponse } from '@/utils/response.handler';
import {
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  InternalServerErrorException,
  Controller,
  Delete,
  Body,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export interface DeleteImageDto {
  urls: string[];
}

@ApiTags('upload')
@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload image to Cloudinary with dynamic folder path
   * @param file - Image file to upload
   * @param folder - Target folder in Cloudinary (e.g., 'basti/chefs', 'basti/products')
   * @returns CloudinaryUploadResult with secure_url
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'unknown error';
  }

  @Post('image')
  @UseGuards(FlexibleJwtGuard)
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder in Cloudinary' })
  @UploadImageDecorator('Upload image to Cloudinary')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Query('folder') folder: string = 'basti/general',
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB limit
          new FileTypeValidator({ fileType: '.(jpeg|png|gif|webp)' }), // Allowed types
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.debug(`Uploading image to folder: ${folder}, filename: ${file.originalname}`);

    try {
      const result = await this.cloudinaryService.uploadFile(
        file.buffer,
        file.originalname,
        folder,
        'image',
      );

      this.logger.log(`Image uploaded to ${folder}: ${result.public_id}`);
      return successResponse(result, 'Image uploaded successfully', 201);
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Delete images by URL array
   * @param urls - Array of Cloudinary image URLs to delete
   * @returns DeleteImageResult with success/failed counts
   */
  @Delete('images')
  @UseGuards(FlexibleJwtGuard)
  @DeleteImagesDecorator('Delete images by URLs')
  async deleteImages(@Body() { urls }: DeleteImageDto) {
    this.logger.debug(`Deleting ${urls.length} images`);

    if (!urls || urls.length === 0) {
      this.logger.warn('No URLs provided for deletion');
      return successResponse({ results: {}, success: 0, failed: 0 }, 'No images to delete', 200);
    }

    const result = await this.cloudinaryService.deleteFilesByUrls(urls);

    this.logger.log(`Image deletion completed: ${result.success} success, ${result.failed} failed`);
    return successResponse(result, 'Images deleted', 200);
  }
}
