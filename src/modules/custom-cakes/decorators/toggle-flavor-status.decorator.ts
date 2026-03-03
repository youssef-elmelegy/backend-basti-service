import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

export function ToggleFlavorStatusDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Toggle flavor active status',
      description:
        'Toggle the active/inactive status of a flavor. Active flavors are visible, inactive flavors are hidden.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the flavor to toggle',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Flavor status toggled successfully',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Flavor not found',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to toggle flavor status',
    }),
  );
}
