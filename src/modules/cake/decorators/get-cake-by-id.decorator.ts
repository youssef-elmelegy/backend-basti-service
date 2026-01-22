import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateCakeDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { CakeExamples } from '@/constants/examples';

export function GetCakeByIdDecorator() {
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
      type: CreateCakeDto,
      example: CakeExamples.getById.response.success,
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
