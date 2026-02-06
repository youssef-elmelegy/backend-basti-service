import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AddonCategory {
  BALLOONS = 'balloons',
  CARDS = 'cards',
  CANDLES = 'candles',
  DECORATIONS = 'decorations',
  OTHER = 'other',
}

export class CreateAddDto {
  @ApiProperty({
    description: 'Add-on name',
    example: 'Extra Chocolate Frosting',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Add-on description',
    example: 'Rich chocolate frosting for extra flavor',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Array of add-on image URLs',
    example: [
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/adds/frosting.jpg',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Add-on category',
    example: 'balloons',
    enum: ['balloons', 'cards', 'candles', 'decorations', 'other'],
  })
  @IsString()
  @IsEnum(AddonCategory)
  category: 'balloons' | 'cards' | 'candles' | 'decorations' | 'other';

  @ApiProperty({
    description: 'Price of the add-on',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @ApiProperty({
    description: 'Array of tags for the add-on',
    example: ['premium', 'chocolate', 'popular'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: 'Whether the add-on is active and visible',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
