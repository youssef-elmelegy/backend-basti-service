import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function DeleteAddonOptionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete add-on option',
      description: 'Deletes an option from a specific add-on.',
    }),
    ApiParam({
      name: 'addonId',
      type: 'string',
      description: 'The UUID of the add-on',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiParam({
      name: 'optionId',
      type: 'string',
      description: 'The UUID of the add-on option',
      example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-on option deleted successfully',
      example: {
        code: 200,
        success: true,
        message: 'Add-on option deleted successfully',
        data: {
          message: 'Add-on option deleted successfully',
        },
        timestamp: '2024-01-15T10:40:00Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Add-on or add-on option not found',
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
      description: 'Failed to delete add-on option',
      type: ErrorResponseDto,
    }),
  );
}
