import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetFlavorVariantImagesResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function GetFlavorVariantImagesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get flavor shape variant images',
      description: 'Retrieves all shape variant images (with shapeId) for a specific flavor.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Flavor variant images successfully retrieved',
      type: GetFlavorVariantImagesResponseDto,
      example: FlavorExamples.getVariantImages.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Flavor not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid flavor ID format',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve flavor variant images due to server error',
      type: ErrorResponseDto,
    }),
  );
}
