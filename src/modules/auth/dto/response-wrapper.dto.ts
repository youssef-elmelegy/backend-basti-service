import { ApiProperty } from '@nestjs/swagger';
import {
  SignupResponseDto,
  VerifyOtpResponseDto,
  SetupProfileResponseDto,
  AuthResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
} from './auth-response.dto';

export class SignupResponseWrapperDto {
  @ApiProperty({
    example: 201,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'User registered successfully. OTP sent to your email',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SignupResponseDto,
    description: 'Response data containing message and email',
  })
  data: SignupResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class VerifyOtpResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Email verified successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: VerifyOtpResponseDto,
    description: 'Response data containing verification message and user info',
  })
  data: VerifyOtpResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SetupProfileResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Profile setup completed',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: SetupProfileResponseDto,
    description: 'Response data containing tokens and user information',
  })
  data: SetupProfileResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class AuthResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'User logged in successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: AuthResponseDto,
    description: 'Response data containing tokens and user information',
  })
  data: AuthResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class RefreshTokenResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Tokens refreshed successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: RefreshTokenResponseDto,
    description: 'Response data containing new tokens',
  })
  data: RefreshTokenResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class LogoutResponseWrapperDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Logout successful',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: LogoutResponseDto,
    description: 'Response data containing logout message',
  })
  data: LogoutResponseDto;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}
