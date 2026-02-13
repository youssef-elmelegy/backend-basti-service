import { IsString, MinLength, MaxLength, IsOptional, IsUrl, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

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

  @ApiProperty({
    description: 'Region image URL',
    example: MOCK_DATA.image.region,
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Image must be a valid URL' })
  image?: string;

  @ApiProperty({
    description: 'Region availability status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
