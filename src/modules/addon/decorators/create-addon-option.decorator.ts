import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { CreateAddonOptionDto } from '../dto';

export function CreateAddonOptionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add option to add-on',
      description: 'Creates a new option under a specific add-on.',
    }),
    ApiParam({
      name: 'addonId',
      type: 'string',
      description: 'The UUID of the add-on',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: CreateAddonOptionDto,
      description: 'Option payload to add to the specified add-on',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Add-on option created successfully',
      example: {
        code: 201,
        success: true,
        message: 'Add-on option created successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          addonId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'color',
          label: 'Red',
          value: 'Red',
          imageUrl:
            'https://res.cloudinary.com/example/image/upload/v1234567890/basti/addons/frosting.jpg',
          createdAt: '2024-01-15T10:30:00Z',
        },
        timestamp: '2024-01-15T10:30:00Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Add-on not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
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
      description: 'Failed to create add-on option',
      type: ErrorResponseDto,
    }),
  );
}
