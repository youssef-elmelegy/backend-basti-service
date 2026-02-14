import { IsString, IsUUID, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
