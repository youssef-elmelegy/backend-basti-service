import {
  IsString,
  IsArray,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSweetDto {
  @ApiProperty({
    description: 'Sweet name',
    example: 'Chocolate Donut',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Sweet description',
    example: 'Delicious chocolate frosted donut with sprinkles',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Array of sweet image URLs',
    example: ['https://res.cloudinary.com/example/image/upload/v1234567890/basti/sweets/donut.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Available sizes for this sweet',
    example: ['small', 'medium', 'large'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  @ApiProperty({
    description: 'Tag ID to assign to this sweet',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiProperty({
    description: 'Whether the sweet is active and visible',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
