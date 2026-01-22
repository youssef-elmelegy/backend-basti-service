import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AdminVerifyOtpDto } from '../dto';
import { SuccessAdminVerifyOtpResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminVerifyOtpEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Verify OTP',
      description: 'Verify 6-digit OTP code and get temporary reset token',
    }),
    ApiBody({
      type: AdminVerifyOtpDto,
      description: 'Email and OTP code',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP verified successfully',
      type: SuccessAdminVerifyOtpResponseDto,
      example: AdminAuthExamples.verifyOtp.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired OTP',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.verifyOtp.response.invalidOtp,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Admin not found',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.verifyOtp.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or expired OTP',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.verifyOtp.response.expiredOtp,
    }),
  );
}
