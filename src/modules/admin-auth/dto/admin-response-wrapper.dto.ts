import { ApiProperty } from '@nestjs/swagger';
import {
  AdminLoginResponseDto,
  AdminForgotPasswordResponseDto,
  AdminVerifyOtpResponseDto,
  AdminResetPasswordResponseDto,
  AdminChangePasswordResponseDto,
  AdminLogoutResponseDto,
} from './admin-response.dto';

export class SuccessAdminLoginResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'Admin logged in successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: AdminLoginResponseDto,
    description: 'Login response data containing tokens and admin info',
  })
  data: AdminLoginResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SuccessAdminForgotPasswordResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'OTP sent to your email',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: AdminForgotPasswordResponseDto,
    description: 'Forgot password response data',
  })
  data: AdminForgotPasswordResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SuccessAdminVerifyOtpResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'OTP verified successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: AdminVerifyOtpResponseDto,
    description: 'Verify OTP response data',
  })
  data: AdminVerifyOtpResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SuccessAdminResetPasswordResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'Password reset successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: AdminResetPasswordResponseDto,
    description: 'Reset password response data',
  })
  data: AdminResetPasswordResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SuccessAdminChangePasswordResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'Password changed successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: AdminChangePasswordResponseDto,
    description: 'Change password response data',
  })
  data: AdminChangePasswordResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SuccessAdminLogoutResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'Logout successful',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: AdminLogoutResponseDto,
    description: 'Logout response data',
  })
  data: AdminLogoutResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class AdminErrorResponseDto {
  @ApiProperty({
    example: false,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'Invalid credentials',
    description: 'Error message or validation messages array',
    oneOf: [
      { type: 'string', example: 'Invalid credentials' },
      { type: 'array', items: { type: 'string' }, example: ['email must be a valid email'] },
    ],
  })
  message: string | string[];

  @ApiProperty({
    example: 'UnauthorizedException',
    description: 'Error type',
  })
  error: string;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}
