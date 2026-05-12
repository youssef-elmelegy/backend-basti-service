import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

class ToggleFeaturedStatusResponseDto {
  message!: string;
}

export function ToggleFeaturedStatusDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Toggle featured status',
      description:
        'Toggle the featured status of an items. Featured items are highlighted in the UI, while non-featured items are displayed normally.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the add-on to toggle',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Item featured status toggled successfully',
      type: ToggleFeaturedStatusResponseDto,
      example: AddExamples.toggleStatus.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Item not found',
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
      description: 'Failed to toggle item featured status',
      type: ErrorResponseDto,
    }),
  );
}
