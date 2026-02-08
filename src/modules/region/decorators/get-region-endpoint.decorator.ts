import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessRegionResponseDto, RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';
import { MOCK_DATA } from '@/constants/global.constants';

export function GetRegionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get region by ID',
      description: 'Retrieves a single region by its unique identifier.',
    }),
    ApiParam({
      name: 'id',
      description: 'Region ID (UUID)',
      example: MOCK_DATA.id.region,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Region successfully retrieved',
      type: SuccessRegionResponseDto,
      example: RegionExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Region not found',
      type: RegionErrorResponseDto,
      example: RegionExamples.getById.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve region due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
