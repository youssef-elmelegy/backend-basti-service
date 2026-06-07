import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminErrorResponseDto } from '@/modules/admin-auth/dto';

export function DeleteDriverEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Delete driver', description: 'Delete a driver account by id.' }),
    ApiParam({ name: 'id', type: String, description: 'Driver ID (UUID)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Driver deleted successfully' }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Driver not found',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: AdminErrorResponseDto,
    }),
  );
}
