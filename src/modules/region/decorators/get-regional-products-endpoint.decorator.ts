import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';
import { MOCK_DATA } from '@/constants/global.constants';

export function GetRegionalProductsDecorator() {
  const successExample = RegionExamples.getRegionalProducts;
  const successData = successExample.response.success;
  const notFoundData = successExample.response.notFound;

  return applyDecorators(
    ApiOperation({
      summary: 'Get all products for a region with prices',
      description:
        'Retrieves all products (sweets, addons, featured-cakes, predesigned-cakes, shapes, decorations, flavors) for a specific region with their regional prices. Supports filtering by product types and pagination.',
    }),
    ApiParam({
      name: 'id',
      description: 'Region ID (UUID)',
      example: MOCK_DATA.id.region,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Regional products successfully retrieved',
      example: successData,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Region not found',
      type: RegionErrorResponseDto,
      example: notFoundData,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve regional products due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
