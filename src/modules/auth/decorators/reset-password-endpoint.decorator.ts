import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ResetPasswordDto, ErrorResponseDto } from '../dto';

export function AuthResetPasswordDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Reset password with token',
      description:
        'Resets user password using a valid reset token obtained from the verify-reset-otp endpoint after OTP verification.',
    }),
    ApiBody({
      type: ResetPasswordDto,
      description: 'Reset token and new password',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password successfully reset',
      schema: {
        example: {
          data: {
            message: 'Password reset successfully',
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
      description: 'Invalid or expired reset token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during password reset',
      type: ErrorResponseDto,
    }),
  );
}
