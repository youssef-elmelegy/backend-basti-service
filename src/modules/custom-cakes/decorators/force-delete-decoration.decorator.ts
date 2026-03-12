import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeleteDecorationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function ForceDeleteDecorationDecorator() {
  const forceDeleteExample = DecorationExamples.forceDelete.response
    .success as unknown as DeleteDecorationResponseDto;
  return applyDecorators(
    ApiOperation({
      summary: 'Force-delete a decoration and its predesigned cake configs',
      description:
        'Deletes a decoration and all predesigned cake configurations that reference it. ' +
        'Use this endpoint after the regular DELETE returns a 409 Conflict and the admin ' +
        'has confirmed they want to remove all related records.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Decoration and all related records successfully deleted',
      type: DeleteDecorationResponseDto,
      example: forceDeleteExample,
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
      description: 'Failed to force-delete decoration due to server error',
      type: ErrorResponseDto,
    }),
  );
}
