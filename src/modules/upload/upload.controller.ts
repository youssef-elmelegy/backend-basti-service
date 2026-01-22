/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Logger,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import type { Multer } from 'multer';
import { CloudinaryService } from '@/common/services/cloudinary.service';
import { UploadImageDecorator, DeleteImagesDecorator } from './decorators/upload.decorator';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { successResponse } from '@/utils/response.handler';

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
  @Post('image')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder in Cloudinary' })
  @UploadImageDecorator('Upload image to Cloudinary')
  async uploadImage(
    @UploadedFile() file: Multer.File,
    @Query('folder') folder: string = 'basti/general',
  ) {
    this.logger.debug(`Uploading image to folder: ${folder}, filename: ${file?.originalname}`);
    this.logger.debug(
      `File received: ${file ? `size=${file.size}, mimetype=${file.mimetype}, encoding=${file.encoding}` : 'NO FILE'}`,
    );

    // Validate file exists
    if (!file) {
      this.logger.error('No file provided for upload - multipart form data missing or empty');
      return successResponse({ secure_url: null }, 'No file provided', 400);
    }

    // Validate file buffer
    if (!file.buffer || file.buffer.length === 0) {
      this.logger.error('File buffer is empty');
      return successResponse({ secure_url: null }, 'File buffer is empty', 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.logger.error(`File size ${file.size} exceeds max size ${maxSize}`);
      return successResponse({ secure_url: null }, 'File size exceeds 5MB', 400);
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.logger.error(`Invalid file type: ${file.mimetype}`);
      return successResponse(
        { secure_url: null },
        'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
        400,
      );
    }

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
      this.logger.error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return successResponse({ secure_url: null }, 'Failed to upload image to Cloudinary', 500);
    }
  }

  /**
   * Delete images by URL array
   * @param urls - Array of Cloudinary image URLs to delete
   * @returns DeleteImageResult with success/failed counts
   */
  @Delete('images')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
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
