import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeleteDecorationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function DeleteDecorationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a decoration',
      description: 'Deletes an existing decoration by its ID.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Decoration successfully deleted',
      type: DeleteDecorationResponseDto,
      example: DecorationExamples.delete.response.success,
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
      description: 'Failed to delete decoration due to server error',
      type: ErrorResponseDto,
    }),
  );
}
