import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'firstName must be at least 2 characters long' })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'lastName must be at least 2 characters long' })
  lastName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'User profile image URL',
    example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'profileImage must be a valid URL' })
  profileImage?: string;
}

export class UpdateProfileResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Profile updated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Updated user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2025-01-11T10:05:00.000Z',
  })
  updatedAt: Date;
}
