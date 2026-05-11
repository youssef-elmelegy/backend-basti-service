import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminErrorResponseDto } from '../dto';

export function AdminDeleteEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Delete admin',
      description: 'Permanently delete an admin account. Accessible to super_admin users only.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Admin ID (UUID)',
      example: '990e8400-e29b-41d4-a716-446655440005',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Admin deleted successfully',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Admin not found',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions (super_admin only)',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete admin due to server error',
      type: AdminErrorResponseDto,
    }),
  );
}
