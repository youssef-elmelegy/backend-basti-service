import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminGetAllEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get all admins',
      description:
        'Retrieve a list of all admins in the system. Accessible to super_admin users only.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Admins retrieved successfully',
      example: (AdminAuthExamples.getAll as { response: { success: unknown } }).response.success,
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
      example: (AdminAuthExamples.getAll as { response: { forbidden: unknown } }).response
        .forbidden,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve admins due to server error',
      type: AdminErrorResponseDto,
    }),
  );
}
