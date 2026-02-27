import {
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DecorationShapeVariantImageDto {
  @ApiProperty({
    description: 'Shape ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  shapeId: string;

  @ApiProperty({
    description: 'Sliced view image URL',
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/sliced.jpg',
  })
  @IsString()
  slicedViewUrl: string;

  @ApiProperty({
    description: 'Front view image URL',
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/front.jpg',
  })
  @IsString()
  frontViewUrl: string;

  @ApiProperty({
    description: 'Top view image URL',
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/top.jpg',
  })
  @IsString()
  topViewUrl: string;
}

export class CreateDecorationWithVariantImagesDto {
  @ApiProperty({
    description: 'Decoration title',
    example: 'Red Roses',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Decoration description',
    example: 'Beautiful red roses for cake decoration',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Decoration image URL',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
  })
  @IsString()
  decorationUrl: string;

  @ApiProperty({
    description: 'Tag ID for categorizing decoration',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiProperty({
    description: 'Array of shape variant images with side, front, and top views',
    type: [DecorationShapeVariantImageDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DecorationShapeVariantImageDto)
  variantImages: DecorationShapeVariantImageDto[];
}
