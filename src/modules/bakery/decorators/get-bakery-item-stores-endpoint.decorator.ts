import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessBakeryItemStoresResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { BakeryExamples } from '@/constants/examples';

export function GetBakeryItemStoresDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all item stores for a bakery',
      description:
        'Retrieve all items and their stock levels for a specific bakery with pricing information',
    }),
    ApiParam({
      name: 'bakeryId',
      type: 'string',
      description: 'The UUID of the bakery',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bakery item stores retrieved successfully',
      type: SuccessBakeryItemStoresResponseDto,
      example: BakeryExamples.getItemStores.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Bakery not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve bakery item stores',
      type: ErrorResponseDto,
    }),
  );
}
