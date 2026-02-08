import {
  IsString,
  IsArray,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  IsUUID,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBakeryDto {
  @ApiProperty({
    description: 'Bakery name',
    example: 'Sweet Cairo Bakery',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Bakery name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Bakery name must not exceed 255 characters' })
  name?: string;

  @ApiProperty({
    description: 'Bakery location description',
    example: '12 El-Maadi St, Cairo',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Location description must be at least 5 characters long' })
  locationDescription?: string;

  @ApiProperty({
    description: 'Region ID this bakery operates in',
    example: '660e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Region ID must be a valid UUID' })
  regionId?: string;

  @ApiProperty({
    description: 'Bakery production capacity per day',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Capacity must be a positive number' })
  capacity?: number;

  @ApiProperty({
    description: 'Types of cakes the bakery produces',
    type: [String],
    enum: ['basket_cakes', 'medium_cakes', 'small_cakes', 'large_cakes', 'custom'],
    example: ['basket_cakes', 'medium_cakes', 'large_cakes'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one bakery type must be specified' })
  @IsString({ each: true })
  bakeryTypes?: string[];
}
