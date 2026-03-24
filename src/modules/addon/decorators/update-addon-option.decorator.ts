import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { UpdateAddonOptionDto } from '../dto';

export function UpdateAddonOptionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update add-on option',
      description: 'Updates an existing option for a specific add-on.',
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
    ApiBody({
      type: UpdateAddonOptionDto,
      description: 'Partial update payload for add-on option',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-on option updated successfully',
      example: {
        code: 200,
        success: true,
        message: 'Add-on option updated successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          addonId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'color',
          label: 'Blue',
          value: 'Blue',
          imageUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/addons/blue.jpg',
          createdAt: '2024-01-15T10:30:00Z',
        },
        timestamp: '2024-01-15T10:35:00Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Add-on or add-on option not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or no fields to update',
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
      description: 'Failed to update add-on option',
      type: ErrorResponseDto,
    }),
  );
}
