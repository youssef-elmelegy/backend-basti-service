import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateAddonDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

export function ToggleAddonStatusDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Toggle add-on active status',
      description:
        'Toggle the active/inactive status of an add-on. Active add-ons are visible, inactive add-ons are hidden.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the add-on to toggle',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-on status toggled successfully',
      type: CreateAddonDto,
      example: AddExamples.toggleStatus.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Add-on not found',
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
      description: 'Failed to toggle add-on status',
      type: ErrorResponseDto,
    }),
  );
}
