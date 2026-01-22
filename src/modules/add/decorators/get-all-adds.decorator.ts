import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateAddDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

export function GetAllAddsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all add-ons',
      description: 'Retrieve all add-ons with pagination support',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number for pagination (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page (default: 10)',
      example: 10,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-ons retrieved successfully',
      type: CreateAddDto,
      example: AddExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve add-ons',
      type: ErrorResponseDto,
    }),
  );
}
