import {
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DecorationShapeVariantImageDto } from './create-decoration-with-variant-images.dto';

export class UpdateDecorationDto {
  @ApiProperty({
    description: 'Decoration title',
    example: 'White Pearls',
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
    description: 'Decoration description',
    example: 'Elegant white pearls decoration',
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
    description: 'Decoration image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  decorationUrl?: string;

  @ApiProperty({
    description: 'Tag ID for categorizing decoration',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiProperty({
    description: 'Array of shape variant images to replace existing ones',
    type: [DecorationShapeVariantImageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DecorationShapeVariantImageDto)
  variantImages?: DecorationShapeVariantImageDto[];

  @ApiProperty({
    description: 'Minimum preparation hours required for this shape',
    example: 24,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minPrepHours must be a number' })
  @Min(0, { message: 'minPrepHours must be greater than or equal to 0' })
  minPrepHours?: number;

  @ApiProperty({
    description: 'Shape capacity (number of servings)',
    example: 20,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Capacity must be a number' })
  @IsPositive({ message: 'Capacity must be greater than 0' })
  capacity?: number;
}
