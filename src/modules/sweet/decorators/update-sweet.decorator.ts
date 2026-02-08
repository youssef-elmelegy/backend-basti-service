import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdateSweetDto, SuccessSweetResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { SweetExamples } from '@/constants/examples';

export function UpdateSweetDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a sweet',
      description: 'Updates an existing sweet with new information.',
    }),
    ApiParam({
      name: 'id',
      description: 'Sweet ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: UpdateSweetDto,
      description: 'Sweet fields to update',
      examples: {
        success: {
          summary: 'Valid sweet update request',
          value: SweetExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Sweet successfully updated',
      type: SuccessSweetResponseDto,
      example: SweetExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Sweet not found',
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
      description: 'Failed to update sweet due to server error',
      type: ErrorResponseDto,
    }),
  );
}
