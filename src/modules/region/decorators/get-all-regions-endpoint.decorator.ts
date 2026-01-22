import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessRegionsResponseDto, RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';

export function GetAllRegionsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all regions',
      description: 'Retrieves a list of all regions.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Regions successfully retrieved',
      type: SuccessRegionsResponseDto,
      example: RegionExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve regions due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
