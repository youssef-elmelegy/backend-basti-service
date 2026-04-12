import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShapeSize } from './create-shape.dto';
import { visualKeyTypeEnum } from '@/db/schema';

export class UpdateShapeDto {
  @ApiProperty({
    description: 'Shape title',
    example: 'Square',
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
    description: 'Shape description',
    example: 'Square cake shape',
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
    description: 'Shape image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  shapeUrl?: string;

  @ApiProperty({
    description: 'Shape size category',
    example: 'medium',
    enum: ShapeSize,
    enumName: 'ShapeSize',
    required: false,
  })
  @IsOptional()
  @IsEnum(ShapeSize, { message: 'Size must be one of: small, medium, large' })
  size?: ShapeSize;

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
  @IsOptional()
  @IsIn(visualKeyTypeEnum.enumValues)
  visualKey?: (typeof visualKeyTypeEnum.enumValues)[number];
}
