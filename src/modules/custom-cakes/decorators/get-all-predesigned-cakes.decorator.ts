import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllPredesignedCakesResponseDto } from '../dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function GetAllPredesignedCakesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Retrieve all predesigned cakes with filtering and pagination',
      description:
        'Get predesigned cakes with optional region filtering, search by name/description, and pagination. Region filter returns only cakes with pricing in that region.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Predesigned cakes retrieved successfully',
      type: GetAllPredesignedCakesResponseDto,
      example: PredesignedCakesExamples.getAll.response.success,
    }),
  );
}
