import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';
import { MOCK_DATA } from '@/constants/global.constants';

export function DeleteRegionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete region',
      description: 'Deletes a region by its unique identifier.',
    }),
    ApiParam({
      name: 'id',
      description: 'Region ID (UUID)',
      example: MOCK_DATA.id.region,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Region successfully deleted',
      example: RegionExamples.delete.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Region not found',
      type: RegionErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete region due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
