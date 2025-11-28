import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SuccessRefreshTokenResponseDto, ErrorResponseDto, RefreshTokenDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthRefreshTokenDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Uses a valid refresh token to obtain a new access token and refresh token pair. The refresh token is validated via JWT strategy.',
    }),
    ApiBody({
      type: RefreshTokenDto,
      description: 'Refresh token request',
      examples: {
        success: {
          summary: 'Valid refresh token request',
          value: AuthExamples.refreshToken.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Token successfully refreshed with new access and refresh tokens',
      type: SuccessRefreshTokenResponseDto,
      example: AuthExamples.refreshToken.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (missing or invalid refresh token)',
      type: ErrorResponseDto,
      example: AuthExamples.refreshToken.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired refresh token',
      type: ErrorResponseDto,
      example: AuthExamples.refreshToken.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during token refresh',
      type: ErrorResponseDto,
      example: AuthExamples.refreshToken.response.internalServerError,
    }),
  );
}
