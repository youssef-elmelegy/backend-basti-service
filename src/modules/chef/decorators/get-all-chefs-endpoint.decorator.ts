import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessChefsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ChefExamples } from '@/constants/examples';

export function GetAllChefsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all chefs (paginated)',
      description: 'Retrieves a paginated list of all chefs with their bakery information.',
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
