import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminResetPasswordDto } from '../dto';
import { SuccessAdminResetPasswordResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminResetPasswordEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Reset Password',
      description:
        'Reset password using temporary token from OTP verification. Requires temporary reset token in Authorization header.',
    }),
    ApiBody({
      type: AdminResetPasswordDto,
      description: 'New password and confirmation',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password reset successfully',
      type: SuccessAdminResetPasswordResponseDto,
      example: AdminAuthExamples.resetPassword.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or passwords do not match',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.resetPassword.response.passwordMismatch,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - invalid or expired reset token',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.resetPassword.response.unauthorized,
    }),
  );
}
