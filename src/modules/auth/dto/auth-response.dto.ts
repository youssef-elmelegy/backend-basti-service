import { ApiProperty } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique user identifier (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'User profile image URL',
    required: false,
  })
  profileImage?: string;

  @ApiProperty({
    example: true,
    description: 'Whether email is verified',
  })
  isEmailVerified: boolean;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'User creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'User last update timestamp',
  })
  updatedAt: Date;
}

export class AuthResponseDto {
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

  @ApiProperty({
    type: UserDataDto,
    description: 'Authenticated user information',
  })
  user: UserDataDto;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New JWT refresh token',
  })
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logout successful',
    description: 'Logout confirmation message',
  })
  message: string;
}

export class SignupResponseDto {
  @ApiProperty({
    example: 'OTP sent to user@example.com',
    description: 'Success message indicating OTP was sent',
  })
  message: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address where OTP was sent',
  })
  email: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    example: 'Email verified successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: UserDataDto,
    description: 'User information after verification',
  })
  user: UserDataDto;
}

export class SetupProfileResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    type: UserDataDto,
    description: 'Complete user information after profile setup',
  })
  user: UserDataDto;
}

export class ErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: false,
    description: 'Response success status',
  })
  success: boolean;

  @ApiProperty({
    example: 'Validation error',
    description: 'Error message or validation error details',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    example: 'BadRequestException',
    description: 'Error type',
  })
  error: string;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

// Wrapper DTOs for SuccessResponse format
export class SuccessAuthResponseDto {
  @ApiProperty({
    example: 201,
    description: 'HTTP status code',
    type: 'number',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Response success status',
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    example: 'User registered successfully',
    description: 'Response message',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    type: AuthResponseDto,
    description: 'Response data containing tokens and user info',
  })
  data: AuthResponseDto;

  @ApiProperty({
    example: '2025-11-28T10:00:00.000Z',
    description: 'Response timestamp',
    type: 'string',
  })
  timestamp: string;
}

export class SuccessRefreshTokenResponseDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
    type: 'number',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Response success status',
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    example: 'Tokens refreshed successfully',
    description: 'Response message',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    type: RefreshTokenResponseDto,
    description: 'Response data containing new tokens',
  })
  data: RefreshTokenResponseDto;

  @ApiProperty({
    example: '2025-11-28T10:00:00.000Z',
    description: 'Response timestamp',
    type: 'string',
  })
  timestamp: string;
}

export class SuccessLogoutResponseDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
    type: 'number',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Response success status',
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    example: 'Logout successful',
    description: 'Response message',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    type: LogoutResponseDto,
    description: 'Response data',
  })
  data: LogoutResponseDto;

  @ApiProperty({
    example: '2025-11-28T10:00:00.000Z',
    description: 'Response timestamp',
    type: 'string',
  })
  timestamp: string;
}
