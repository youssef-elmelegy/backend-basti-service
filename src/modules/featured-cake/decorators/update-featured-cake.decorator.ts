import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateFeaturedCakeDto, SuccessFeaturedCakeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FeaturedCakeExamples } from '@/constants/examples';

export function UpdateFeaturedCakeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a cake',
      description:
        'Update cake details including images, flavors, sizes, and pricing. All fields are optional.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the cake to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateFeaturedCakeDto,
      description:
        'Partial update - all fields are optional. Provide only the fields you want to update.',
      examples: {
        success: {
          summary: 'Valid cake update request',
          value: FeaturedCakeExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cake updated successfully',
      type: SuccessFeaturedCakeResponseDto,
      example: FeaturedCakeExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cake not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
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
      description: 'Failed to update cake',
      type: ErrorResponseDto,
    }),
  );
}
