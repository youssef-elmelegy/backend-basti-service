import { IsString, IsInt, Min, Max, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name (must be unique)',
    example: 'chocolate',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Display order of the tag',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(9999)
  displayOrder: number;

  @ApiProperty({
    description: 'Array of tag types (e.g., "sweets", "cakes", etc.)',
    example: ['sweets', 'cakes'],
    minItems: 1,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  types: string[];
}
