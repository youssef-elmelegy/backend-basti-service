import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
