import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AdminDataDto {
  @ApiProperty({
    example: '990e8400-e29b-41d4-a716-446655440004',
    description: 'Unique admin identifier (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email address',
  })
  email: string;

  @ApiProperty({
    example: 'admin',
    description: 'Admin role',
    enum: ['super_admin', 'admin', 'manager'],
  })
  role: 'super_admin' | 'admin' | 'manager';

  @ApiProperty({
    example: null,
    description: 'Admin profile image URL',
    required: false,
    nullable: true,
  })
  profileImage?: string;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Admin creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Admin last update timestamp',
  })
  updatedAt: Date;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for API authentication',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token for obtaining new access tokens',
  })
  refreshToken: string;

  @Type(() => AdminDataDto)
  @ApiProperty({
    type: AdminDataDto,
    description: 'Authenticated admin information',
  })
  admin: AdminDataDto;
}

export class AdminForgotPasswordResponseDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email address where OTP was sent',
  })
  email: string;
}

export class AdminVerifyOtpResponseDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email address',
  })
  email: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Temporary reset token (set in HTTP-only cookie)',
    required: false,
  })
  resetToken?: string;
}

export class AdminResetPasswordResponseDto {
  @ApiProperty({
    example: 'Password reset successfully',
    description: 'Success message',
  })
  message: string;
}

export class AdminChangePasswordResponseDto {
  @ApiProperty({
    example: 'Password changed successfully',
    description: 'Success message',
  })
  message: string;
}

export class AdminLogoutResponseDto {
  @ApiProperty({
    example: 'Logout successful',
    description: 'Logout confirmation message',
  })
  message: string;
}
