import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ChangeRegionOrderDto, RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';
import { MOCK_DATA } from '@/constants/global.constants';

export function ChangeRegionOrderDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change region order',
      description:
        'Changes the order position of a region. Automatically reorders other regions to maintain sequential order numbering.',
    }),
    ApiParam({
      name: 'id',
      description: 'Region ID (UUID)',
      example: MOCK_DATA.id.region,
    }),
    ApiBody({
      type: ChangeRegionOrderDto,
      description: 'New order position for the region',
      examples: {
        success: {
          summary: 'Valid region order change request',
          value: RegionExamples.changeOrder.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Region order successfully changed, returns all regions sorted by order',
      example: RegionExamples.changeOrder.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid order position',
      type: RegionErrorResponseDto,
      example: RegionExamples.changeOrder.response.badRequest,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Region not found',
      type: RegionErrorResponseDto,
      example: RegionExamples.changeOrder.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to change region order due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
