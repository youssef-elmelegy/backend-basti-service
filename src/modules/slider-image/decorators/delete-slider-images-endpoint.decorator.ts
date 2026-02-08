import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessSliderImageMessageResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function DeleteSliderImagesDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiParam({
      name: 'id',
      description: 'The unique identifier (UUID) of the slider image to delete',
      example: 'bb0e8400-e29b-41d4-a716-446655440007',
    }),
    ApiOperation({
      summary: 'Delete a slider image by ID',
      description: 'Deletes a specific slider image by its ID.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Slider image successfully deleted',
      type: SuccessSliderImageMessageResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Slider image not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Admin authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - Insufficient permissions (admin role required)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete slider image due to server error',
      type: ErrorResponseDto,
    }),
  );
}
