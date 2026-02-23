import { IsString, IsUUID, MinLength, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ShapeVariantImageDto {
  @ApiProperty({
    description: 'Shape ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  shapeId: string;

  @ApiProperty({
    description: 'Side view image URL',
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/side.jpg',
  })
  @IsString()
  sideViewUrl: string;

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

export class CreateFlavorWithVariantImagesDto {
  @ApiProperty({
    description: 'Flavor title',
    example: 'Chocolate',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Flavor description',
    example: 'Rich chocolate flavor with smooth texture',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Flavor image URL',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
  })
  @IsString()
  flavorUrl: string;

  @ApiProperty({
    description: 'Array of shape variant images with side, front, and top views',
    type: [ShapeVariantImageDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShapeVariantImageDto)
  variantImages: ShapeVariantImageDto[];
}
