import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRegionDto {
  @ApiProperty({
    description: 'Region name',
    example: 'Alexandria',
    minLength: 2,
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Region name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Region name must not exceed 255 characters' })
  name?: string;
}
