import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { SuccessAdminRefreshTokenResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminRefreshTokenEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiHeader({
      name: 'x-client-type',
      description:
        'Client type identifier. Use "mobile" for mobile clients to receive tokens in response instead of cookies.',
      required: false,
      example: 'mobile',
    }),
    ApiOperation({
      summary: 'Refresh Admin Tokens',
      description:
        'Generate new access and refresh tokens using the refresh token. For web clients, tokens are stored in HTTP-only cookies. For mobile clients (header: x-client-type=mobile), tokens are returned in the response body.',
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
