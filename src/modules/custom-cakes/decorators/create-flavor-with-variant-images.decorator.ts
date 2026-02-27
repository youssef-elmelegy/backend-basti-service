import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateFlavorWithVariantImagesDto, SuccessFlavorResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function CreateFlavorWithVariantImagesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a flavor with shape variant images',
      description:
        'Creates a new flavor along with variant images (side, front, top views) for multiple shapes in a single request.',
    }),
    ApiBody({
      type: CreateFlavorWithVariantImagesDto,
      description: 'Flavor data and shape variant images (side, front, and top views)',
      examples: {
        success: {
          summary: 'Valid flavor creation with variant images request',
          value: FlavorExamples.createWithVariantImages.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Flavor and variant images successfully created',
      type: SuccessFlavorResponseDto,
      example: FlavorExamples.createWithVariantImages.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create flavor or variant images due to server error',
      type: ErrorResponseDto,
    }),
  );
}
