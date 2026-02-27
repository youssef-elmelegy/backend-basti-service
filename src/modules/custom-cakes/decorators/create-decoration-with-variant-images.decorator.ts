import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateDecorationWithVariantImagesDto, SuccessDecorationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function CreateDecorationWithVariantImagesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a decoration with shape variant images',
      description:
        'Creates a new decoration along with variant images (side, front, top views) for multiple shapes in a single request.',
    }),
    ApiBody({
      type: CreateDecorationWithVariantImagesDto,
      description: 'Decoration data and shape variant images (side, front, and top views)',
      examples: {
        success: {
          summary: 'Valid decoration creation with variant images request',
          value: DecorationExamples.createWithVariantImages.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Decoration and variant images successfully created',
      type: SuccessDecorationResponseDto,
      example: DecorationExamples.createWithVariantImages.response.success,
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
      description: 'Failed to create decoration or variant images due to server error',
      type: ErrorResponseDto,
    }),
  );
}
