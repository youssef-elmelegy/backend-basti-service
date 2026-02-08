import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessFeaturedCakeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FeaturedCakeExamples } from '@/constants/examples';

export function GetFeaturedCakeByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get cake by ID',
      description: 'Retrieve a specific cake by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the cake',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cake retrieved successfully',
      type: SuccessFeaturedCakeResponseDto,
      example: FeaturedCakeExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cake not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve cake',
      type: ErrorResponseDto,
    }),
  );
}
