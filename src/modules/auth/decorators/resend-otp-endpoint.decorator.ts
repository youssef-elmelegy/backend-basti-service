import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorResponseDto, ResendOtpDto, SignupResponseWrapperDto } from '../dto';

export function AuthResendOtpDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Resend OTP to email',
      description:
        'Resends the one-time password (OTP) to the user email address. Use this if the original OTP was not received or has expired.',
    }),
    ApiBody({
      type: ResendOtpDto,
      description: 'Email address to send OTP to',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP resent successfully',
      type: SignupResponseWrapperDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email already verified',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or too many resend attempts',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
    }),
  );
}
