import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFeaturedCakeDto {
  @ApiProperty({
    description: 'Featured cake name',
    example: 'Chocolate Dream Cake Updated',
    minLength: 2,
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @ApiProperty({
    description: 'Featured cake description',
    example: 'Delicious chocolate cake with rich ganache',
    minLength: 10,
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Array of featured cake image URLs',
    example: [
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
    ],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Featured cake capacity (number of servings)',
    example: 12,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @ApiProperty({
    description: 'List of available flavors for this featured cake',
    example: ['Chocolate', 'Vanilla', 'Strawberry'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flavorList?: string[];

  @ApiProperty({
    description: 'List of available piping palettes for this featured cake',
    example: ['Gold', 'Silver', 'Rose Gold'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pipingPaletteList?: string[];

  @ApiProperty({
    description: 'Tag ID to assign to this featured cake',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiProperty({
    description: 'Whether the featured cake is active and visible',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
