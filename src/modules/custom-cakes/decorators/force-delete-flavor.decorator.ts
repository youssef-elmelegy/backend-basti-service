import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeleteFlavorResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function ForceDeleteFlavorDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Force-delete a flavor and its predesigned cake configs',
      description:
        'Deletes a flavor and all predesigned cake configurations that reference it. ' +
        'Use this endpoint after the regular DELETE returns a 409 Conflict and the admin ' +
        'has confirmed they want to remove all related records.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Flavor and all related records successfully deleted',
      type: DeleteFlavorResponseDto,
      example: FlavorExamples.forceDelete.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Flavor not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid flavor ID format',
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
      description: 'Failed to force-delete flavor due to server error',
      type: ErrorResponseDto,
    }),
  );
}
