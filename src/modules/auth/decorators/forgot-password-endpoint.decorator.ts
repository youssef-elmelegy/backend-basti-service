import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ForgotPasswordDto, ErrorResponseDto } from '../dto';

export function AuthForgotPasswordDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Request password reset OTP',
      description:
        'Sends a password reset OTP to the user email. Returns success regardless of whether email exists (security best practice). User must then verify the OTP using the verify-reset-otp endpoint.',
    }),
    ApiBody({
      type: ForgotPasswordDto,
      description: 'User email address',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password reset OTP sent (or user not found)',
      schema: {
        example: {
          data: {
            message: 'If the email exists, an OTP has been sent',
            email: 'user@example.com',
          },
          statusCode: 200,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during OTP sending',
      type: ErrorResponseDto,
    }),
  );
}
