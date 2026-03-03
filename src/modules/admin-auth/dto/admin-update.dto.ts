import { IsString, MaxLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminDto {
  @ApiProperty({
    description: 'Admin role',
    example: 'admin',
    enum: ['super_admin', 'admin', 'manager'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['super_admin', 'admin', 'manager'], {
    message: 'Role must be one of: super_admin, admin, manager',
  })
  role?: 'super_admin' | 'admin' | 'manager';

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
