import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

export function DeleteAddDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete an add-on',
      description: 'Permanently delete an add-on by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the add-on to delete',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-on deleted successfully',
      example: AddExamples.delete.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Add-on not found',
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
      description: 'Failed to delete add-on',
      type: ErrorResponseDto,
    }),
  );
}
