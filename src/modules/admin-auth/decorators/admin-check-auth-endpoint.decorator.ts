import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessAdminCheckAuthResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminCheckAuthEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Check Admin Authentication',
      description:
        'Check if the current request has a valid JWT token and return authenticated admin info if available.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Request completed - returns authentication status',
      type: SuccessAdminCheckAuthResponseDto,
      examples: {
        authenticated: {
          summary: 'Admin is authenticated',
          value: AdminAuthExamples.checkAuth.response.authenticated,
        },
        notAuthenticated: {
          summary: 'Admin is not authenticated',
          value: AdminAuthExamples.checkAuth.response.notAuthenticated,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired token',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.checkAuth.response.unauthorized,
    }),
  );
}
