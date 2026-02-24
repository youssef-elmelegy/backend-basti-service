import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiProperty({
    description: 'Tag name (must be unique)',
    example: 'chocolate',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Display order of the tag',
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(9999)
  @IsOptional()
  displayOrder?: number;
}
