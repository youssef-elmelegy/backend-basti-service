import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeleteShapeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ShapeExamples } from '@/constants/examples';

export function ForceDeleteShapeDecorator() {
  const forceDeleteExample = ShapeExamples.forceDelete.response
    .success as unknown as DeleteShapeResponseDto;
  return applyDecorators(
    ApiOperation({
      summary: 'Force-delete a shape and its predesigned cake configs',
      description:
        'Deletes a shape and all predesigned cake configurations that reference it. ' +
        'Use this endpoint after the regular DELETE returns a 409 Conflict and the admin ' +
        'has confirmed they want to remove all related records.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Shape and all related records successfully deleted',
      type: DeleteShapeResponseDto,
      example: forceDeleteExample,
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
      description: 'Failed to force-delete shape due to server error',
      type: ErrorResponseDto,
    }),
  );
}
