import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PredesignedCakeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function GetPredesignedCakeByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Retrieve a predesigned cake by ID',
      description: 'Get a single predesigned cake with all its details including tag name',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Predesigned cake retrieved successfully',
      type: PredesignedCakeResponseDto,
      example: PredesignedCakesExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Predesigned cake not found',
      type: ErrorResponseDto,
    }),
  );
}
