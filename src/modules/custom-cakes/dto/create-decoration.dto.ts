import {
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDecorationDto {
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
    description: 'Minimum preparation hours required for this decoration',
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
  })
  @IsNumber({}, { message: 'Capacity must be a number' })
  @IsPositive({ message: 'Capacity must be greater than 0' })
  capacity: number;
}
