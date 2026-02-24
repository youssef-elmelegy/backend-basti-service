import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeleteShapeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ShapeExamples } from '@/constants/examples';

export function DeleteShapeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a shape',
      description: 'Deletes an existing cake shape by its ID.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Shape successfully deleted',
      type: DeleteShapeResponseDto,
      example: ShapeExamples.delete.response.success,
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
      description: 'Failed to delete shape due to server error',
      type: ErrorResponseDto,
    }),
  );
}
