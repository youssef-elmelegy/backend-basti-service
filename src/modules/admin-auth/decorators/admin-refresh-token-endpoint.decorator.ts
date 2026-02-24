import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessAdminRefreshTokenResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminRefreshTokenEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Refresh Admin Tokens',
      description:
        'Generate new access and refresh tokens using the refresh token cookie. New tokens are stored in HTTP-only cookies.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tokens refreshed successfully',
      type: SuccessAdminRefreshTokenResponseDto,
      example: AdminAuthExamples.refreshToken.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired refresh token',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.refreshToken.response.unauthorized,
    }),
  );
}
