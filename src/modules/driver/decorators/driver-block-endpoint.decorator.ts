import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { BlockAdminDto } from '@/modules/admin-auth/dto';
import { AdminDataDto, AdminErrorResponseDto } from '@/modules/admin-auth/dto';

export function BlockDriverEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Block/Unblock driver',
      description: 'Block or unblock a driver account.',
    }),
    ApiParam({ name: 'id', type: String, description: 'Driver ID (UUID)' }),
    ApiBody({ type: BlockAdminDto, description: 'Block status' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Driver block status updated successfully',
      type: AdminDataDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: AdminErrorResponseDto,
    }),
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
