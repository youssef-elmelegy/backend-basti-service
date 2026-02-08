import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateSweetRegionItemPriceDto, SuccessSweetRegionItemPriceResponseDto } from '../dto';

export function CreateSweetRegionItemPriceDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create region pricing for a sweet',
      description:
        'Admin-only endpoint to create or update pricing for a sweet in a specific region. Creates or updates a record in the region_item_prices table.',
    }),
    ApiBody({
      type: CreateSweetRegionItemPriceDto,
      examples: {
        'Create pricing': {
          summary: 'Create pricing for a sweet in a region',
          value: {
            sweetId: '550e8400-e29b-41d4-a716-446655440000',
            regionId: '660f9500-f39c-51e5-b826-557766551111',
            price: '150.00',
            sizesPrices: {
              Small: '100.00',
              Large: '200.00',
            },
          },
        },
        'Create pricing without size prices': {
          summary: 'Create pricing for a sweet in a region without size prices',
          value: {
            sweetId: '550e8400-e29b-41d4-a716-446655440000',
            regionId: '660f9500-f39c-51e5-b826-557766551111',
            price: '150.00',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Region pricing created successfully',
      type: SuccessSweetRegionItemPriceResponseDto,
      example: {
        code: 201,
        success: true,
        message: 'Region pricing created successfully',
        data: {
          sweetId: '550e8400-e29b-41d4-a716-446655440000',
          regionId: '660f9500-f39c-51e5-b826-557766551111',
          price: '150.00',
          sizesPrices: {
            Small: '100.00',
            Large: '200.00',
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        timestamp: '2024-01-15T10:30:00Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid sweet or region UUID, or sweet/region not found',
      example: {
        code: 400,
        success: false,
        message: 'Sweet with ID xxx not found',
        error: 'BadRequestException',
        timestamp: '2024-01-15T10:30:00Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - JWT token missing or invalid',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - User does not have admin role',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}
