import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateRegionDto, SuccessRegionResponseDto, RegionErrorResponseDto } from '../dto';
import { RegionExamples } from '@/constants/examples';

export function CreateRegionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new region',
      description: 'Creates a new region with a unique name.',
    }),
    ApiBody({
      type: CreateRegionDto,
      description: 'Region creation data',
      examples: {
        success: {
          summary: 'Valid region creation request',
          value: RegionExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Region successfully created',
      type: SuccessRegionResponseDto,
      example: RegionExamples.create.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: RegionErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Region with this name already exists',
      type: RegionErrorResponseDto,
      example: RegionExamples.create.response.conflict,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create region due to server error',
      type: RegionErrorResponseDto,
    }),
  );
}
