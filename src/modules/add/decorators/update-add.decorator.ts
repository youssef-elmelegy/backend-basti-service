import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateAddDto, CreateAddDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

export function UpdateAddDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an add-on',
      description:
        'Update add-on details including images, category, price, and tags. All fields are optional.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the add-on to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateAddDto,
      description:
        'Partial update - all fields are optional. Provide only the fields you want to update.',
      examples: {
        success: {
          summary: 'Valid add-on update request',
          value: AddExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-on updated successfully',
      type: CreateAddDto,
      example: AddExamples.update.response.success,
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
      description: 'Failed to update add-on',
      type: ErrorResponseDto,
    }),
  );
}
