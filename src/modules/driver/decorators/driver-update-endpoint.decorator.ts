import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdateDriverDto } from '../dto';
import { AdminDataDto, AdminErrorResponseDto } from '@/modules/admin-auth/dto';

export function UpdateDriverEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update driver', description: 'Update driver information.' }),
    ApiParam({ name: 'id', type: String, description: 'Driver ID (UUID)' }),
    ApiBody({ type: UpdateDriverDto, description: 'Driver update details' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Driver updated successfully',
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
