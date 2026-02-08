import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { RateChefDto, SuccessChefRatingResponseDto } from '../dto';
import { ChefExamples } from '@/constants/examples';
import { MOCK_DATA } from '@/constants/global.constants';

export function RateChefDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Rate a chef',
      description: 'Allows a user to rate a chef from 1 to 5 stars with an optional comment.',
    }),
    ApiParam({
      name: 'id',
      description: 'Chef ID (UUID)',
      example: MOCK_DATA.id.chef,
    }),
    ApiBody({
      type: RateChefDto,
      description: 'Rating data',
      examples: {
        success: {
          summary: 'Valid rating request',
          value: ChefExamples.rateChef.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Chef successfully rated',
      type: SuccessChefRatingResponseDto,
      example: ChefExamples.rateChef.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Chef not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - User must be logged in',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to rate chef due to server error',
      type: ErrorResponseDto,
    }),
  );
}
