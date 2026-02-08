import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  REGION_ITEM_PRICE_CREATE_REQUEST_EXAMPLE,
  REGION_ITEM_PRICE_RESPONSE_EXAMPLE,
} from '@/constants/examples/region-item-price-examples';
import {
  CreateRegionItemPriceDto,
  SuccessRegionItemPriceResponseDto,
  FeaturedCakeErrorResponseDto,
} from '../dto';

export function CreateRegionItemPriceDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create region pricing for a featured cake',
      description:
        'Admin-only endpoint to create or update pricing for a featured cake in a specific region. Creates a record in the region_item_prices table.',
    }),
    ApiBody({
      type: CreateRegionItemPriceDto,
      examples: {
        'Create pricing': {
          summary: 'Create pricing for a cake in a region',
          value: REGION_ITEM_PRICE_CREATE_REQUEST_EXAMPLE,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Region pricing created successfully',
      type: SuccessRegionItemPriceResponseDto,
      example: REGION_ITEM_PRICE_RESPONSE_EXAMPLE,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid featured cake or region UUID, or cake/region not found',
      type: FeaturedCakeErrorResponseDto,
      example: {
        code: 400,
        success: false,
        message: 'Featured cake with ID xxx not found',
        error: 'BadRequestException',
        timestamp: '2024-01-15T10:30:00Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - JWT token missing or invalid',
      type: FeaturedCakeErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - User does not have admin role',
      type: FeaturedCakeErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
      type: FeaturedCakeErrorResponseDto,
    }),
  );
}
