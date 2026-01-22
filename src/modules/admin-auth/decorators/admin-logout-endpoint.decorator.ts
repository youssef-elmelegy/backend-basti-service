import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessAdminLogoutResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminLogoutEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Logout',
      description: 'Logout admin. Client should clear tokens from cookies.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Logout successful',
      type: SuccessAdminLogoutResponseDto,
      example: AdminAuthExamples.logout.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - invalid or expired token',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.logout.response.unauthorized,
    }),
  );
}
