import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminResetPasswordDto } from '../dto';
import { SuccessAdminResetPasswordResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminResetPasswordEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Reset Password',
      description:
        'Reset password using the temporary token from OTP verification. Web clients: the token is read exclusively from the HTTP-only `resetToken` cookie set by `verify-otp` and is NOT accepted in the body — send the request with credentials. Mobile clients (`x-client-type: mobile`): send the token in the body as `resetToken`.',
    }),
    ApiBody({
      type: AdminResetPasswordDto,
      description: 'New password, plus `resetToken` for mobile clients only',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password reset successfully',
      type: SuccessAdminResetPasswordResponseDto,
      example: AdminAuthExamples.resetPassword.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or invalid password',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.resetPassword.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - invalid or expired reset token',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.resetPassword.response.unauthorized,
    }),
  );
}
