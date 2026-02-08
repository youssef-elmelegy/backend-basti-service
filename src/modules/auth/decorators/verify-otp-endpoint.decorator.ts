import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorResponseDto, VerifyOtpDto, VerifyOtpResponseWrapperDto } from '../dto';

export function AuthVerifyOtpDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify email with OTP',
      description:
        'Verifies the user email address using the one-time password (OTP) sent to their email. After verification, user receives a temporary token (valid for 10 minutes) to complete profile setup.',
    }),
    ApiBody({
      type: VerifyOtpDto,
      description: 'OTP verification data',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Email verified successfully',
      type: VerifyOtpResponseWrapperDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired OTP',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
    }),
  );
}
