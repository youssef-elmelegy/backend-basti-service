import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdateAdminDto } from '../dto';
import { AdminDataDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminUpdateEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Update admin',
      description:
        'Update admin information including role, bakery assignment, and profile image. Accessible to super_admin users only.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Admin ID (UUID)',
      example: '990e8400-e29b-41d4-a716-446655440005',
    }),
    ApiBody({
      type: UpdateAdminDto,
      description: 'Admin update details',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Admin updated successfully',
      type: AdminDataDto,
      example: (AdminAuthExamples.update as { response: { success: unknown } }).response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: AdminErrorResponseDto,
      example: (AdminAuthExamples.update as { response: { validationError: unknown } }).response
        .validationError,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Admin not found',
      type: AdminErrorResponseDto,
      example: (AdminAuthExamples.update as { response: { notFound: unknown } }).response.notFound,
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
      example: (AdminAuthExamples.update as { response: { forbidden: unknown } }).response
        .forbidden,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update admin due to server error',
      type: AdminErrorResponseDto,
    }),
  );
}
