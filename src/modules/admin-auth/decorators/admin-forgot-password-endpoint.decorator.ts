import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminForgotPasswordDto } from '../dto';
import { SuccessAdminForgotPasswordResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminForgotPasswordEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Forgot Password',
      description: 'Send OTP to admin email for password reset',
    }),
    ApiBody({
      type: AdminForgotPasswordDto,
      description: 'Admin email address',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP sent to email successfully',
      type: SuccessAdminForgotPasswordResponseDto,
      example: AdminAuthExamples.forgotPassword.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Admin not found',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.forgotPassword.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.forgotPassword.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to send OTP email',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.forgotPassword.response.internalServerError,
    }),
  );
}
