import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllPredesignedCakesResponseDto } from '../dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function GetAllPredesignedCakesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Retrieve all predesigned cakes with filtering and pagination',
      description:
        'Retrieve all predesigned cakes with optional filtering by tag, active status, region, and search. When isActive is specified, only active or inactive predesigned cakes are returned. Pagination supported.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Predesigned cakes retrieved successfully',
      type: GetAllPredesignedCakesResponseDto,
      example: PredesignedCakesExamples.getAll.response.success,
    }),
  );
}
