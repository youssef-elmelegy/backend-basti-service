import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdateRegionDto, SuccessRegionResponseDto, RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';
import { MOCK_DATA } from '@/constants/global.constants';

export function UpdateRegionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update region',
      description: 'Updates a region by its unique identifier.',
    }),
    ApiParam({
      name: 'id',
      description: 'Region ID (UUID)',
      example: MOCK_DATA.id.region,
    }),
    ApiBody({
      type: UpdateRegionDto,
      description: 'Region update data',
      examples: {
        success: {
          summary: 'Valid region update request',
          value: RegionExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Region successfully updated',
      type: SuccessRegionResponseDto,
      example: RegionExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: RegionErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Region not found',
      type: RegionErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Region with this name already exists',
      type: RegionErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update region due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
