import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateAddonRegionItemPriceDto, SuccessAddonRegionItemPriceResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function CreateAddonRegionItemPriceDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create or update add-on region pricing',
      description: 'Connect an add-on with a region and set pricing and sizes pricing',
    }),
    ApiBody({
      type: CreateAddonRegionItemPriceDto,
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Region pricing created successfully',
      type: SuccessAddonRegionItemPriceResponseDto,
      example: {
        code: 201,
        success: true,
        message: 'Region pricing created successfully',
        data: {
          addonId: '550e8400-e29b-41d4-a716-446655440000',
          regionId: '550e8400-e29b-41d4-a716-446655440001',
          price: '50',
          sizesPrices: {
            small: '30',
            medium: '50',
            large: '70',
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        timestamp: '2024-01-15T10:30:00Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid addon or region ID',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create region pricing',
      type: ErrorResponseDto,
    }),
  );
}
