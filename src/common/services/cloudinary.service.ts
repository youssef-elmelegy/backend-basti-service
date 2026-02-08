import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinaryModule } from 'cloudinary';
import { env } from '@/env';

const cloudinary = cloudinaryModule;

/**
 * Cloudinary Upload Result
 * Contains metadata about uploaded files
 */
export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  size: number;
  format: string;
  resource_type: string;
}

/**
 * Cloudinary Delete Result
 * Contains information about deletion operations
 */
export interface CloudinaryDeleteResult {
  results: Record<string, string>;
  success: number;
  failed: number;
}

/**
 * Cloudinary Service
 * Handles file uploads and deletions to Cloudinary
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    this.logger.debug('Cloudinary configured successfully');
  }

  /**
   * Upload a single file to Cloudinary
   * @param buffer - File buffer to upload
   * @param originalFilename - Original filename with extension
   * @param folder - Folder path in Cloudinary (default: "basti")
   * @param resourceType - Type of resource: image, video, or raw (default: "image")
   * @returns CloudinaryUploadResult with file metadata
   */
  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    folder: string = 'basti',
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<CloudinaryUploadResult> {
    const publicId = `${Date.now()}-${originalFilename.split('.')[0]}`;

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: resourceType,
          overwrite: false,
        },
        (error: unknown, result: unknown) => {
          if (error) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            } else if (error && typeof error === 'object' && 'message' in error) {
              const msg = (error as Record<string, unknown>).message;
              if (typeof msg === 'string') {
                errorMessage = msg;
              }
            }
            this.logger.error(`Cloudinary upload failed for ${originalFilename}: ${errorMessage}`);
            reject(new Error(`Cloudinary upload failed: ${errorMessage}`));
            return;
          }

          if (!result) {
            this.logger.error(`Cloudinary upload returned no result for ${originalFilename}`);
            reject(new Error('Cloudinary upload failed: no result returned'));
            return;
          }

          const uploadResult = result as Record<string, unknown>;
          const uploadedPublicId =
            typeof uploadResult.public_id === 'string' ? uploadResult.public_id : 'unknown';
          this.logger.debug(`File uploaded successfully: ${uploadedPublicId}`);
          resolve({
            public_id: uploadResult.public_id as string,
            url: uploadResult.url as string,
            secure_url: uploadResult.secure_url as string,
            size: uploadResult.bytes as number,
            format: uploadResult.format as string,
            resource_type: uploadResult.resource_type as string,
          });
        },
      );

      stream.on('error', (error: unknown) => {
        let errorMessage = 'Unknown stream error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        this.logger.error(`Stream error during upload: ${errorMessage}`);
        reject(new Error(`Stream error: ${errorMessage}`));
      });

      stream.end(buffer);
    });
  }

  /**
   * Upload multiple files to Cloudinary in parallel
   * @param files - Array of file objects with buffer and originalFilename
   * @param folder - Folder path in Cloudinary (default: "basti")
   * @param resourceType - Type of resource: image, video, or raw (default: "image")
   * @returns Array of CloudinaryUploadResult objects
   */
  async uploadMultipleFiles(
    files: { buffer: Buffer; originalFilename: string }[],
    folder: string = 'basti',
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<CloudinaryUploadResult[]> {
    this.logger.debug(`Uploading ${files.length} files to folder: ${folder}`);
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.originalFilename, folder, resourceType),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a single file from Cloudinary by public_id
   * @param publicId - Cloudinary public_id of the file to delete
   * @returns Object with result status
   */
  private async deleteFile(publicId: string): Promise<{ result: string }> {
    return new Promise<{ result: string }>((resolve, reject) => {
      let isResolved = false;

      cloudinary.uploader
        .destroy(publicId, (error: unknown, result: unknown) => {
          if (isResolved) return;
          isResolved = true;

          if (error) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            } else if (error && typeof error === 'object' && 'message' in error) {
              const msg = (error as Record<string, unknown>).message;
              if (typeof msg === 'string') {
                errorMessage = msg;
              }
            }
            this.logger.error(`Cloudinary delete failed for ${publicId}: ${errorMessage}`);
            reject(new Error(`Cloudinary delete failed: ${errorMessage}`));
          } else {
            this.logger.debug(`File deleted successfully: ${publicId}`);
            const resultObj = result as Record<string, unknown>;
            const resultValue = (resultObj?.result as string) || 'ok';
            resolve({ result: resultValue });
          }
        })
        .catch((err: unknown) => {
          if (!isResolved) {
            isResolved = true;
            let errorMessage = 'Unknown error';
            if (err instanceof Error) {
              errorMessage = err.message;
            } else if (typeof err === 'string') {
              errorMessage = err;
            }
            this.logger.error(`Cloudinary delete promise error: ${errorMessage}`);
            reject(new Error(`Cloudinary delete promise error: ${errorMessage}`));
          }
        });
    });
  }

  /**
   * Delete multiple files from Cloudinary by public_id array
   * @param publicIds - Array of Cloudinary public_ids to delete
   * @returns Object with results, success count, and failed count
   */
  async deleteMultipleFiles(publicIds: string[]): Promise<CloudinaryDeleteResult> {
    this.logger.debug(`Deleting ${publicIds.length} files from Cloudinary`);
    const results: Record<string, string> = {};
    let success = 0;
    let failed = 0;

    for (const publicId of publicIds) {
      try {
        const result = await this.deleteFile(publicId);
        results[publicId] = result.result;
        success++;
      } catch {
        results[publicId] = 'failed';
        failed++;
      }
    }

    return { results, success, failed };
  }

  /**
   * Delete files by secure URLs (extracts public_id from URL)
   * @param urls - Array of Cloudinary secure URLs to delete
   * @returns Object with results, success count, and failed count
   */
  async deleteFilesByUrls(urls: string[]): Promise<CloudinaryDeleteResult> {
    this.logger.debug(`Extracting public_ids from ${urls.length} URLs and deleting`);
    const publicIds = urls.map((url) => this.extractPublicIdFromUrl(url));
    return this.deleteMultipleFiles(publicIds);
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param url - Cloudinary secure URL
   * @returns Extracted public_id
   * @private
   */
  private extractPublicIdFromUrl(url: string): string {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const afterUpload = url.substring(uploadIndex + 8); // 8 = length of "/upload/"
      const publicIdWithoutExt = afterUpload.substring(0, afterUpload.lastIndexOf('.'));

      // Remove the version part (v1763349477/)
      const versionMatch = publicIdWithoutExt.match(/^v\d+\//);
      if (versionMatch) {
        return publicIdWithoutExt.substring(versionMatch[0].length);
      }

      return publicIdWithoutExt;
    }

    // Fallback: extract from end of URL
    const parts = url.split('/');
    const fileWithFormat = parts[parts.length - 1];
    return fileWithFormat.split('.')[0];
  }
}
