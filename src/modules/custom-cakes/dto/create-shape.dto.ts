import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { visualKeyTypeEnum } from '@/db/schema';

export enum ShapeSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export class CreateShapeDto {
  @ApiProperty({
    description: 'Shape title',
    example: 'Round',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Shape description',
    example: 'Classic round cake shape',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Shape image URL',
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
  })
  @IsString()
  shapeUrl: string;

  @ApiProperty({
    description: 'Shape size category',
    example: 'medium',
    enum: ShapeSize,
    enumName: 'ShapeSize',
  })
  @IsEnum(ShapeSize, { message: 'Size must be one of: small, medium, large' })
  size: ShapeSize;

  @ApiProperty({
    description: 'Shape capacity (number of servings)',
    example: 20,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Capacity must be a number' })
  @IsPositive({ message: 'Capacity must be greater than 0' })
  capacity: number;

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
    enum: visualKeyTypeEnum.enumValues,
    description: 'The visual key representing the shape design',
  })
  @IsIn(visualKeyTypeEnum.enumValues)
  visualKey!: (typeof visualKeyTypeEnum.enumValues)[number];
}
