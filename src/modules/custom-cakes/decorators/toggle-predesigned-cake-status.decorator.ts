import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PredesignedCakeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function TogglePredesignedCakeStatusDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Toggle predesigned cake active status',
      description:
        'Toggle the active/inactive status of a predesigned cake. Active cakes are visible, inactive cakes are hidden.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the predesigned cake to toggle',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Predesigned cake status toggled successfully',
      type: PredesignedCakeResponseDto,
      example: PredesignedCakesExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Predesigned cake not found',
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
      description: 'Failed to toggle predesigned cake status',
      type: ErrorResponseDto,
    }),
  );
}
