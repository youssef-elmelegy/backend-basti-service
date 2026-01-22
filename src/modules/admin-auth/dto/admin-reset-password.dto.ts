import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminResetPasswordDto {
  @ApiProperty({
    description: 'Reset token from OTP verification (can be in cookie or body)',
    example: 'eyJhbGciOiJIUzI1NiIs...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Reset token must be a string' })
  resetToken?: string;

  @ApiProperty({
    description: 'New password (min 8 characters, must include uppercase, lowercase, number)',
    example: 'NewSecurePass123',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password must not exceed 255 characters' })
  password?: string;

  @ApiProperty({
    description: 'New password (when coming from API client)',
    example: 'NewSecurePass123',
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(255, { message: 'New password must not exceed 255 characters' })
  newPassword?: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'NewSecurePass123',
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Confirm password must not exceed 255 characters' })
  confirmPassword?: string;
}
