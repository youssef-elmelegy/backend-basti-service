import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VerifyResetOtpDto, ErrorResponseDto } from '../dto';

export function AuthVerifyResetOtpDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Verify password reset OTP',
      description:
        'Verifies the OTP sent to the user email for password reset. Email must be verified. Returns a reset token for use with reset-password endpoint.',
    }),
    ApiBody({
      type: VerifyResetOtpDto,
      description: 'Email and OTP for password reset verification',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'OTP verified successfully, reset token generated',
      schema: {
        example: {
          data: {
            message: 'OTP verified successfully',
            resetToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
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
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired OTP, or email not verified',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during OTP verification',
      type: ErrorResponseDto,
    }),
  );
}
