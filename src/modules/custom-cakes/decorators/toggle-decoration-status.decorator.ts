import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

export function ToggleDecorationStatusDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Toggle decoration active status',
      description:
        'Toggle the active/inactive status of a decoration. Active decorations are visible, inactive decorations are hidden.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the decoration to toggle',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Decoration status toggled successfully',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Decoration not found',
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
      description: 'Failed to toggle decoration status',
    }),
  );
}
