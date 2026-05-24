import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { StorageService } from '@/common/services/storage.service';
import {
  UploadImageDecorator,
  DeleteImagesDecorator,
  ListImagesDecorator,
} from './decorators/upload.decorator';
import { FlexibleJwtGuard } from '@/common/guards/flexible-jwt.guard';
import { successResponse } from '@/utils/response.handler';
import {
  Post,
  Get,
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
import { Public } from '@/common';
import { getErrorMessage } from '@/utils';

export interface DeleteImageDto {
  urls: string[];
}

@ApiTags('upload')
@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload image to R2 with dynamic folder path
   * @param file - Image file to upload
   * @param folder - Target folder in R2 (e.g., 'basti/chefs', 'basti/products')
   * @returns StorageUploadResult with secure_url
   */
  @Public()
  @Post('image')
  // @UseGuards(FlexibleJwtGuard)
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder in R2' })
  @UploadImageDecorator('Upload image to R2')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Query('folder') folder: string = 'basti/general',
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB limit
          new FileTypeValidator({ fileType: '.(jpeg|png|gif|webp)' }), // Allowed types
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.debug(`Uploading image to folder: ${folder}, filename: ${file.originalname}`);

    try {
      const result = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        folder,
        'image',
        file.mimetype,
      );

      this.logger.log(`Image uploaded to ${folder}: ${result.public_id}`);
      return successResponse(result, 'route.upload.image_uploaded', 201);
    } catch (error) {
      this.logger.error(`Upload failed: ${getErrorMessage(error)}`);
      throw new InternalServerErrorException('route.upload.image_failed_upload');
    }
  }

  /**
   * Delete images by URL array. Non-R2 URLs (e.g. legacy Cloudinary links)
   * are reported as `skipped` instead of failing the request.
   * @param urls - Array of image URLs to delete
   * @returns StorageDeleteResult with success/failed/skipped counts
   */
  @Delete('images')
  @UseGuards(FlexibleJwtGuard)
  @DeleteImagesDecorator('Delete images by URLs')
  async deleteImages(@Body() { urls }: DeleteImageDto) {
    this.logger.debug(`Deleting ${urls?.length ?? 0} images`);

    if (!urls || urls.length === 0) {
      this.logger.warn('No URLs provided for deletion');
      return successResponse(
        { results: {}, success: 0, failed: 0, skipped: 0 },
        'route.upload.no_images_to_delete',
      );
    }

    const result = await this.storageService.deleteFilesByUrls(urls);

    this.logger.log(
      `Image deletion completed: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`,
    );
    return successResponse(result, 'route.upload.images_deleted');
  }

  /**
   * List images in R2 by folder prefix (paginated).
   * @param prefix - Folder prefix (e.g. 'basti/chefs')
   * @param cursor - Opaque continuation token from a previous response
   * @param limit - Page size (1-1000, default 100)
   * @returns StorageListResult with objects + nextCursor
   */
  @Get('images')
  @UseGuards(FlexibleJwtGuard)
  @ListImagesDecorator('List images by folder prefix')
  async listImages(
    @Query('prefix') prefix: string = 'basti',
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(Math.max(parseInt(limit ?? '100', 10) || 100, 1), 1000);
    const result = await this.storageService.listFiles(prefix, cursor, parsedLimit);
    this.logger.log(
      `Listed ${result.objects.length} object(s) under prefix "${prefix}" (truncated=${result.isTruncated})`,
    );
    return successResponse(result, 'route.upload.images_listed');
  }
}
