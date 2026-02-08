import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

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
        'Upload an image file to Cloudinary storage. Returns secure_url for use in database. Requires JWT Bearer token authentication.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file to upload (JPG, PNG, GIF, etc.)',
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
            public_id: 'basti/chefs/1234567890-chef',
            url: 'http://res.cloudinary.com/dzyxpwpcb/image/upload/basti/chefs/1234567890-chef.jpg',
            secure_url:
              'https://res.cloudinary.com/dzyxpwpcb/image/upload/basti/chefs/1234567890-chef.jpg',
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
        'Delete multiple images from Cloudinary by providing their URLs. Returns detailed results. Requires JWT Bearer token authentication.',
    }),
    ApiBody({
      schema: {
        example: {
          urls: [
            'https://res.cloudinary.com/dzyxpwpcb/image/upload/v1763349477/basti/chefs/1234567890-chef.jpg',
            'https://res.cloudinary.com/dzyxpwpcb/image/upload/v1763349478/basti/chefs/1234567890-chef2.jpg',
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
              'basti/chefs/1234567890-chef': 'ok',
              'basti/chefs/1234567890-chef2': 'ok',
            },
            success: 2,
            failed: 0,
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
