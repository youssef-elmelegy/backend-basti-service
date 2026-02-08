import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessSweetResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function ToggleSweetStatusDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Toggle sweet status',
      description: 'Toggles the active status of a sweet.',
    }),
    ApiParam({
      name: 'id',
      description: 'Sweet ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Sweet status successfully toggled',
      type: SuccessSweetResponseDto,
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
      description: 'Failed to toggle sweet status due to server error',
      type: ErrorResponseDto,
    }),
  );
}
