import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SuccessChefsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ChefExamples } from '@/constants/examples';

export function GetAllChefsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all chefs (paginated)',
      description: 'Retrieves a paginated list of all chefs with their bakery information.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10, max: 100)',
      example: 10,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Chefs successfully retrieved',
      type: SuccessChefsResponseDto,
      example: ChefExamples.getAllPaginated.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve chefs due to server error',
      type: ErrorResponseDto,
    }),
  );
}
