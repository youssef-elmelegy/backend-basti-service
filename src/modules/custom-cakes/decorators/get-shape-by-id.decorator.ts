import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessShapeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ShapeExamples } from '@/constants/examples';

export function GetShapeByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get shape by ID',
      description: 'Retrieves a specific cake shape by its ID.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Shape successfully retrieved',
      type: SuccessShapeResponseDto,
      example: ShapeExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Shape not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid shape ID format',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve shape due to server error',
      type: ErrorResponseDto,
    }),
  );
}
