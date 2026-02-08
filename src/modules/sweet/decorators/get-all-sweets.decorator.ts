import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllSweeetsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { SweetExamples } from '@/constants/examples';

export function GetAllSweetsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all sweets',
      description: 'Retrieves all available sweets with pagination and sorting options.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Sweets successfully retrieved',
      type: GetAllSweeetsResponseDto,

      example: SweetExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve sweets due to server error',
      type: ErrorResponseDto,
    }),
  );
}
