import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateAddDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

export function GetAddByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get add-on by ID',
      description: 'Retrieve a specific add-on by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the add-on',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-on retrieved successfully',
      type: CreateAddDto,
      example: AddExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Add-on not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve add-on',
      type: ErrorResponseDto,
    }),
  );
}
