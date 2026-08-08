import {
  IsString,
  IsArray,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  BAKERY_TYPES,
  BAKERY_GALLERY_MAX_IMAGES,
  BAKERY_NOTES_MAX_LENGTH,
  type BakeryTypeValue,
} from '@/db/schema/bakery';

export class CreateBakeryDto {
  @ApiProperty({
    description: 'Bakery name',
    example: 'Sweet Cairo Bakery',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Bakery name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Bakery name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Bakery location description',
    example: '12 El-Maadi St, Cairo',
  })
  @IsString()
  @MinLength(5, { message: 'Location description must be at least 5 characters long' })
  locationDescription: string;

  @ApiProperty({
    description: 'Region ID this bakery operates in',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4', { message: 'Region ID must be a valid UUID' })
  regionId: string;

  @ApiProperty({
    description: 'Bakery production capacity per day',
    example: 50,
    minimum: 0,
  })
  @IsInt()
  @Min(0, { message: 'Capacity must be a positive number' })
  capacity: number;

  @ApiProperty({
    description: 'Types of cakes the bakery produces',
    type: [String],
    enum: BAKERY_TYPES,
    example: ['big_cakes', 'small_cakes'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one bakery type must be specified' })
  @IsIn(BAKERY_TYPES, {
    each: true,
    message: `Each bakery type must be one of: ${BAKERY_TYPES.join(', ')}`,
  })
  bakeryTypes: BakeryTypeValue[];

  @ApiProperty({
    description: 'Management-only free-text notes about the bakery',
    example: 'Closed for renovation until March. Contact the owner on the mobile number.',
    maxLength: BAKERY_NOTES_MAX_LENGTH,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(BAKERY_NOTES_MAX_LENGTH, {
    message: `Notes must not exceed ${BAKERY_NOTES_MAX_LENGTH} characters`,
  })
  notes?: string;

  @ApiProperty({
    description: 'URL of the bakery logo icon',
    example: 'https://res.cloudinary.com/demo/image/upload/basti/bakeries/logo.webp',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

  @ApiProperty({
    description: `Gallery image URLs (max ${BAKERY_GALLERY_MAX_IMAGES})`,
    type: [String],
    example: ['https://res.cloudinary.com/demo/image/upload/basti/bakeries/shopfront.webp'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BAKERY_GALLERY_MAX_IMAGES, {
    message: `A bakery can have at most ${BAKERY_GALLERY_MAX_IMAGES} gallery images`,
  })
  @IsUrl({}, { each: true, message: 'Each gallery image must be a valid URL' })
  galleryImages?: string[];
}
