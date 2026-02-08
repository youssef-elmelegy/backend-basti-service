import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FeaturedCakeExamples } from '@/constants/examples';
import { SuccessFeaturedCakeResponseDto } from '../dto';

export function DeleteFeaturedCakeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a cake',
      description: 'Permanently delete a cake product',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the cake to delete',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cake deleted successfully',
      type: SuccessFeaturedCakeResponseDto,
      example: FeaturedCakeExamples.delete.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cake not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete cake',
      type: ErrorResponseDto,
    }),
  );
}
