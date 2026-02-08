import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessSweetResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { SweetExamples } from '@/constants/examples';

export function GetSweetByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get sweet by ID',
      description: 'Retrieves a specific sweet by its ID.',
    }),
    ApiParam({
      name: 'id',
      description: 'Sweet ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Sweet successfully retrieved',
      type: SuccessSweetResponseDto,

      example: SweetExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Sweet not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve sweet due to server error',
      type: ErrorResponseDto,
    }),
  );
}
