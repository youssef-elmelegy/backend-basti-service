import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  MinLength,
  MaxLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSizeDto {
  @ApiProperty({
    description: 'Size name (e.g., small, medium, large)',
    example: 'medium',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Size must not be empty' })
  size: string;

  @ApiProperty({
    description: 'Price for this size',
    example: 250,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;
}

export class UpdateCakeDto {
  @ApiProperty({
    description: 'Cake name',
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
    description: 'Cake description',
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
    description: 'Array of cake image URLs',
    example: [
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/cakes/chocolate.jpg',
    ],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Main price of the cake',
    example: 280,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  mainPrice?: number;

  @ApiProperty({
    description: 'Cake capacity (number of servings)',
    example: 12,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @ApiProperty({
    description: 'Array of cake tags/categories',
    example: ['chocolate', 'classic', 'premium'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Array of cake flavors',
    example: ['dark chocolate', 'milk chocolate'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flavors?: string[];

  @ApiProperty({
    description: 'Array of cake sizes with their prices',
    example: [
      { size: 'small', price: 150 },
      { size: 'medium', price: 250 },
      { size: 'large', price: 400 },
    ],
    type: [UpdateSizeDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSizeDto)
  sizes?: UpdateSizeDto[];

  @ApiProperty({
    description: 'Whether the cake is active and visible',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
