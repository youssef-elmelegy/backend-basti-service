import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessRegionResponseDto, RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';
import { MOCK_DATA } from '@/constants/global.constants';

export function DeleteRegionalItemPriceDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete regional product pricing',
      description:
        'Removes pricing for a specific product in a region by deleting the regional item price record.',
    }),
    ApiParam({
      name: 'regionId',
      description: 'Region ID (UUID)',
      example: MOCK_DATA.id.region,
    }),
    ApiParam({
      name: 'productType',
      description:
        'Product type (featured-cakes, addons, sweets, flavors, shapes, decorations, predesigned-cakes)',
      example: 'featured-cakes',
    }),
    ApiParam({
      name: 'productId',
      description: 'Product ID (UUID)',
      example: MOCK_DATA.id.region,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Regional item price successfully deleted',
      type: SuccessRegionResponseDto,
      example: RegionExamples.deleteRegionalItemPrice.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Regional item price not found',
      type: RegionErrorResponseDto,
      example: RegionExamples.deleteRegionalItemPrice.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete regional item price due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
