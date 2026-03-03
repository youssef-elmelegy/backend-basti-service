import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'newadmin@basti.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Admin password (min 8 characters, must include uppercase, lowercase, number)',
    example: 'NewAdminPass1',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password must not exceed 255 characters' })
  password: string;

  @ApiProperty({
    description: 'Admin role',
    example: 'admin',
    enum: ['super_admin', 'admin', 'manager'],
  })
  @IsEnum(['super_admin', 'admin', 'manager'], {
    message: 'Role must be one of: super_admin, admin, manager',
  })
  role: 'super_admin' | 'admin' | 'manager';

  @ApiProperty({
    description: 'Associated bakery ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Bakery ID must be a valid UUID' })
  bakeryId?: string;

  @ApiProperty({
    description: 'Admin profile image URL',
    example: 'https://example.com/images/admin.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Profile image must be a string' })
  @MaxLength(500, { message: 'Profile image URL must not exceed 500 characters' })
  profileImage?: string;
}
