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
        'Reset password using temporary token from OTP verification. The temporary reset token can be provided in an HTTP-only cookie or in the request body (`resetToken`).',
    }),
    ApiBody({
      type: AdminResetPasswordDto,
      description: 'Reset token and new password',
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
