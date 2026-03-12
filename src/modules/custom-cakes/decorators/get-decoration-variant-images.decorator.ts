import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetDecorationVariantImagesResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function GetDecorationVariantImagesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get decoration shape variant images',
      description: 'Retrieves all shape variant images (with shapeId) for a specific decoration.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Decoration variant images successfully retrieved',
      type: GetDecorationVariantImagesResponseDto,
      example: DecorationExamples.getVariantImages.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Decoration not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid decoration ID format',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve decoration variant images due to server error',
      type: ErrorResponseDto,
    }),
  );
}
