import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessFeaturedCakesResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FeaturedCakeExamples } from '@/constants/examples';

export function GetAllFeaturedCakesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all cakes',
      description: 'Retrieve all cakes with pagination support',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cakes retrieved successfully',
      type: SuccessFeaturedCakesResponseDto,
      example: FeaturedCakeExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve cakes',
      type: ErrorResponseDto,
    }),
  );
}
