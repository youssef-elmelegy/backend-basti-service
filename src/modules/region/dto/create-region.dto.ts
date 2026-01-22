import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({
    description: 'Region name',
    example: 'Cairo',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Region name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Region name must not exceed 255 characters' })
  name: string;
}
