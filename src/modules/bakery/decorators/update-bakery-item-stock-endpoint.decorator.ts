import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateBakeryItemStockDto, SuccessBakeryItemStoreResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { BakeryExamples } from '@/constants/examples';

export function UpdateBakeryItemStockDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update stock for a bakery item',
      description: 'Update the stock quantity for a specific item in a bakery store',
    }),
    ApiParam({
      name: 'bakeryId',
      type: 'string',
      description: 'The UUID of the bakery',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiParam({
      name: 'storeId',
      type: 'string',
      description: 'The UUID of the bakery item store',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiBody({
      type: UpdateBakeryItemStockDto,
      description: 'Stock update data',
      examples: {
        success: {
          summary: 'Valid stock update',
          value: BakeryExamples.updateItemStock?.request as Record<string, unknown>,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Stock updated successfully',
      type: SuccessBakeryItemStoreResponseDto,
      example: BakeryExamples.updateItemStock?.response?.success as Record<string, unknown>,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid stock value (cannot be negative)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Item store not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update stock',
      type: ErrorResponseDto,
    }),
  );
}
