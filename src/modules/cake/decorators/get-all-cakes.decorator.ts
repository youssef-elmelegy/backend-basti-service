import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateCakeDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { CakeExamples } from '@/constants/examples';

export function GetAllCakesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all cakes',
      description: 'Retrieve all cakes with pagination support',
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
      description: 'Cakes retrieved successfully',
      type: CreateCakeDto,
      example: CakeExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve cakes',
      type: ErrorResponseDto,
    }),
  );
}
