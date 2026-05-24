import { applyDecorators } from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

/**
 * Decorator for image upload endpoint
 * Provides comprehensive Swagger documentation
 */
export function UploadImageDecorator(description: string = 'Upload image') {
  return applyDecorators(
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: description,
      description:
        'Upload an image file to Cloudflare R2 object storage. Returns secure_url for use in database.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file to upload (JPG, PNG, GIF, WEBP). Max 10MB.',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Image uploaded successfully',
      schema: {
        example: {
          code: 201,
          success: true,
          message: 'Image uploaded successfully',
          data: {
            public_id: 'basti/chefs/1700000000-chef.jpg',
            url: 'https://assets.basty.ly/basti/chefs/1700000000-chef.jpg',
            secure_url: 'https://assets.basty.ly/basti/chefs/1700000000-chef.jpg',
            size: 102400,
            format: 'jpg',
            resource_type: 'image',
          },
          timestamp: '2026-01-18T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid file or missing required field',
      schema: {
        example: {
          code: 400,
          success: false,
          message: 'No file uploaded',
          error: 'Bad Request',
          timestamp: '2026-01-18T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );
}

/**
 * Decorator for image deletion endpoint
 * Provides comprehensive Swagger documentation
 */
export function DeleteImagesDecorator(description: string = 'Delete images') {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: description,
      description:
        'Delete one or more images from R2 by URL. URLs not pointing at R2 (e.g. legacy Cloudinary URLs) are reported under `skipped` instead of failing the request.',
    }),
    ApiBody({
      schema: {
        example: {
          urls: [
            'https://assets.basty.ly/basti/chefs/1700000000-chef.jpg',
            'https://assets.basty.ly/basti/chefs/1700000001-chef2.jpg',
          ],
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Images deletion completed',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Images deleted',
          data: {
            results: {
              'basti/chefs/1700000000-chef.jpg': 'ok',
              'basti/chefs/1700000001-chef2.jpg': 'ok',
            },
            success: 2,
            failed: 0,
            skipped: 0,
          },
          timestamp: '2026-01-18T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - No URLs provided',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );
}

/**
 * Decorator for image listing endpoint
 * Provides Swagger documentation for the paginated GET /uploads/images route.
 */
export function ListImagesDecorator(description: string = 'List images') {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: description,
      description:
        'List objects stored in R2 under a given folder prefix. Results are paginated; pass the returned `nextCursor` as `cursor` to fetch the next page.',
    }),
    ApiQuery({
      name: 'prefix',
      required: false,
      description: 'Folder prefix to filter by, e.g. "basti/chefs". Defaults to "basti".',
    }),
    ApiQuery({
      name: 'cursor',
      required: false,
      description: 'Opaque continuation token from a previous response',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
      description: 'Page size (1-1000, default 100)',
    }),
    ApiResponse({
      status: 200,
      description: 'Images listed successfully',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Images listed successfully',
          data: {
            objects: [
              {
                key: 'basti/chefs/1700000000-chef.jpg',
                url: 'https://assets.basty.ly/basti/chefs/1700000000-chef.jpg',
                size: 102400,
                lastModified: '2026-01-18T12:00:00.000Z',
              },
            ],
            isTruncated: false,
            nextCursor: null,
          },
          timestamp: '2026-01-18T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
    }),
  );
}
