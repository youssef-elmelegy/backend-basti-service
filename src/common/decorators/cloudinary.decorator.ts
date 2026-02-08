import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

/**
 * Decorator for single image upload endpoints
 * Configures Swagger documentation for multipart/form-data file uploads
 *
 * @param description - Operation description for Swagger
 * @param fieldName - Form field name for file (default: "file")
 */
export function UploadImageDecorator(
  description: string = 'Upload image',
  fieldName: string = 'file',
) {
  return applyDecorators(
    ApiOperation({
      summary: description,
      description: `Upload a single image file to Cloudinary under the "basti" folder. Supported formats: jpg, jpeg, png, gif, webp. Maximum size: 10MB.`,
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
            description: 'Image file to upload',
          },
        },
        required: [fieldName],
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
          message: 'File is required',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: 413,
      description: 'Payload Too Large - File exceeds maximum size (10MB)',
      schema: {
        example: {
          message: 'File too large',
          error: 'Payload Too Large',
          statusCode: 413,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error - Cloudinary upload failed',
      schema: {
        example: {
          message: 'Cloudinary upload failed: Internal server error',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}

/**
 * Decorator for multiple image upload endpoints
 * Configures Swagger documentation for multipart/form-data multiple file uploads
 *
 * @param description - Operation description for Swagger
 * @param fieldName - Form field name for files (default: "files")
 */
export function UploadMultipleImagesDecorator(
  description: string = 'Upload multiple images',
  fieldName: string = 'files',
) {
  return applyDecorators(
    ApiOperation({
      summary: description,
      description: `Upload multiple image files to Cloudinary under the "basti" folder. Supported formats: jpg, jpeg, png, gif, webp. Maximum size per file: 10MB. Maximum files: 10.`,
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            description: 'Image files to upload (multiple)',
          },
        },
        required: [fieldName],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Images uploaded successfully',
      schema: {
        example: {
          code: 201,
          success: true,
          message: 'Images uploaded successfully',
          data: [
            {
              public_id: 'basti/chefs/1234567890-chef1',
              url: 'http://res.cloudinary.com/dzyxpwpcb/image/upload/basti/chefs/1234567890-chef1.jpg',
              secure_url:
                'https://res.cloudinary.com/dzyxpwpcb/image/upload/basti/chefs/1234567890-chef1.jpg',
              size: 102400,
              format: 'jpg',
              resource_type: 'image',
            },
            {
              public_id: 'basti/chefs/1234567890-chef2',
              url: 'http://res.cloudinary.com/dzyxpwpcb/image/upload/basti/chefs/1234567890-chef2.jpg',
              secure_url:
                'https://res.cloudinary.com/dzyxpwpcb/image/upload/basti/chefs/1234567890-chef2.jpg',
              size: 98304,
              format: 'jpg',
              resource_type: 'image',
            },
          ],
          timestamp: '2026-01-18T12:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid files or missing required field',
      schema: {
        example: {
          message: 'Files are required',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: 413,
      description: 'Payload Too Large - File exceeds maximum size (10MB)',
      schema: {
        example: {
          message: 'File too large',
          error: 'Payload Too Large',
          statusCode: 413,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error - Cloudinary upload failed',
      schema: {
        example: {
          message: 'Cloudinary upload failed: Internal server error',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}

/**
 * Decorator for image deletion endpoints
 * Configures Swagger documentation for image deletion by URLs
 *
 * @param description - Operation description for Swagger
 */
export function DeleteImagesDecorator(description: string = 'Delete images') {
  return applyDecorators(
    ApiOperation({
      summary: description,
      description: `Delete one or more images from Cloudinary by providing their secure URLs. The service will extract the public_id from each URL and delete the files.`,
    }),
    ApiBody({
      description: 'Array of Cloudinary image URLs to delete',
      schema: {
        example: {
          urls: [
            'https://res.cloudinary.com/dzyxpwpcb/image/upload/v1234567890/basti/chefs/1234567890-chef1.jpg',
            'https://res.cloudinary.com/dzyxpwpcb/image/upload/v1234567890/basti/chefs/1234567890-chef2.jpg',
          ],
        },
        properties: {
          urls: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
              description: 'Cloudinary secure URL',
            },
            minItems: 1,
            description: 'Array of image URLs to delete',
          },
        },
        required: ['urls'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Images deleted successfully (or partially)',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Images deleted successfully',
          data: {
            results: {
              'basti/chefs/1234567890-chef1': 'ok',
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
      description: 'Bad Request - Invalid URLs array or empty',
      schema: {
        example: {
          message: 'urls must be an array with at least one URL',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error - Cloudinary deletion failed',
      schema: {
        example: {
          message: 'Failed to delete images',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
