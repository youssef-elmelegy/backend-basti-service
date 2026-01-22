import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminChangePasswordDto {
  @ApiProperty({
    description: 'Current admin password',
    example: 'SecurePass123',
    minLength: 8,
  })
  @IsString({ message: 'Current password must be a string' })
  @MinLength(8, { message: 'Current password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Current password must not exceed 255 characters' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password (min 8 characters, must include uppercase, lowercase, number)',
    example: 'NewSecurePass456',
    minLength: 8,
  })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(255, { message: 'New password must not exceed 255 characters' })
  newPassword: string;

  @ApiProperty({
    description: 'Password confirmation (must match newPassword)',
    example: 'NewSecurePass456',
    minLength: 8,
  })
  @IsString({ message: 'Confirm password must be a string' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Confirm password must not exceed 255 characters' })
  confirmPassword: string;
}
