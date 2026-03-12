import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ShapeVariantImageDto } from './create-flavor-with-variant-images.dto';

export class UpdateFlavorDto {
  @ApiProperty({
    description: 'Flavor title',
    example: 'Vanilla',
    minLength: 2,
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  @ApiProperty({
    description: 'Flavor description',
    example: 'Sweet vanilla flavor',
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
    description: 'Flavor image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  flavorUrl?: string;

  @ApiProperty({
    description: 'Array of shape variant images to replace existing ones',
    type: [ShapeVariantImageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShapeVariantImageDto)
  variantImages?: ShapeVariantImageDto[];
}
