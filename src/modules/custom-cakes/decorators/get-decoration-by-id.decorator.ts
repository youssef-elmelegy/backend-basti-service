import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessDecorationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function GetDecorationByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get decoration by ID',
      description: 'Retrieves a specific decoration by its ID.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Decoration successfully retrieved',
      type: SuccessDecorationResponseDto,
      example: DecorationExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Decoration not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid decoration ID format',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve decoration due to server error',
      type: ErrorResponseDto,
    }),
  );
}
