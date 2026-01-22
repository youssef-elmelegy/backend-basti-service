import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateCakeDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { CakeExamples } from '@/constants/examples';

export function ToggleCakeStatusDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Toggle cake active status',
      description:
        'Toggle the active/inactive status of a cake. Active cakes are visible, inactive cakes are hidden.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the cake to toggle',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cake status toggled successfully',
      type: CreateCakeDto,
      example: CakeExamples.toggleStatus.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cake not found',
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
      description: 'Failed to toggle cake status',
      type: ErrorResponseDto,
    }),
  );
}
