import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateAdminDto } from '../dto';
import { AdminDataDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminCreateEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create new admin',
      description: 'Create a new admin account. Accessible to super_admin users only.',
    }),
    ApiBody({
      type: CreateAdminDto,
      description: 'Admin creation details',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Admin created successfully',
      type: AdminDataDto,
      example: (AdminAuthExamples.create as { response: { success: unknown } }).response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or email already exists',
      type: AdminErrorResponseDto,
      example: (AdminAuthExamples.create as { response: { emailExists: unknown } }).response
        .emailExists,
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
      example: (AdminAuthExamples.create as { response: { forbidden: unknown } }).response
        .forbidden,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create admin due to server error',
      type: AdminErrorResponseDto,
    }),
  );
}
