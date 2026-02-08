import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessBakeryResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { BakeryExamples } from '@/constants/examples';

export function GetBakeryDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get bakery by ID',
      description: 'Retrieve a specific bakery by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the bakery',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bakery retrieved successfully',
      type: SuccessBakeryResponseDto,
      example: BakeryExamples.getById?.response?.success as Record<string, unknown>,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Bakery not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve bakery',
      type: ErrorResponseDto,
    }),
  );
}
