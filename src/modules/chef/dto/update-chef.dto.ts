import { IsString, IsUUID, IsUrl, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChefDto {
  @ApiProperty({
    description: 'Chef name',
    example: 'John Anderson',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Chef name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Chef name must not exceed 255 characters' })
  name?: string;

  @ApiProperty({
    description: 'Chef specialization',
    example: 'Pastry Chef',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Specialization must be at least 2 characters long' })
  @MaxLength(255, { message: 'Specialization must not exceed 255 characters' })
  specialization?: string;

  @ApiProperty({
    description: 'Chef profile image URL',
    example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Image must be a valid URL' })
  image?: string;

  @ApiProperty({
    description: 'Chef biography',
    example:
      'Experienced pastry chef with 10 years of culinary expertise. Specializes in French pastries and cake decorations.',
    required: false,
    minLength: 10,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Bio must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Bio must not exceed 1000 characters' })
  bio?: string;

  @ApiProperty({
    description: 'Bakery ID where the chef works',
    example: '770e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Bakery ID must be a valid UUID' })
  bakeryId?: string;
}
