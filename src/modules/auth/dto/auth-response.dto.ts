import { ApiProperty } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique user identifier (UUID)',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    type: 'string',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    example: '2025-11-28T10:00:00.000Z',
    description: 'User creation timestamp',
    type: 'string',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-11-28T10:00:00.000Z',
    description: 'User last update timestamp',
    type: 'string',
  })
  updatedAt: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNTc1NjAwfQ.signature',
    description: 'JWT access token for API authentication',
    type: 'string',
  })
  accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNjU4NDAwfQ.signature',
    description: 'JWT refresh token for obtaining new access tokens',
    type: 'string',
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
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjEwMCwiZXhwIjoxNzMxNTc1NzAwfQ.newsignature',
    description: 'New JWT access token',
    type: 'string',
  })
  accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjEwMCwiZXhwIjoxNzMxNjU4NTAwfQ.newsignature',
    description: 'New JWT refresh token',
    type: 'string',
  })
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logout successful',
    description: 'Logout confirmation message',
    type: 'string',
  })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
    type: 'number',
  })
  code: number;

  @ApiProperty({
    example: false,
    description: 'Response success status',
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    example: ['email must be an email', 'password must be at least 8 characters'],
    description: 'Error message or validation error details',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    example: 'BadRequestException',
    description: 'Error type',
    type: 'string',
  })
  error: string;

  @ApiProperty({
    example: '2025-11-28T10:00:00.000Z',
    description: 'Response timestamp',
    type: 'string',
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
