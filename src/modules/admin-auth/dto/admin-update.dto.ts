import { IsString, MaxLength, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
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
    description: 'Admin name',
    example: 'New Admin',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Admin/Driver phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Associated bakery ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Bakery ID must be a valid UUID' })
  bakeryId?: string;

  @ApiProperty({
    description: 'Associated region ID (UUID) — used for drivers',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Region ID must be a valid UUID' })
  regionId?: string;

  @ApiProperty({
    description: 'Admin profile image URL',
    example: 'https://example.com/images/admin.jpg',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: UpdateAdminDto) => o.profileImage !== null)
  @IsString({ message: 'Profile image must be a string' })
  @MaxLength(500, { message: 'Profile image URL must not exceed 500 characters' })
  profileImage?: string | null;
}
