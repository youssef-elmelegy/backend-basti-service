import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AddonCategory } from '../dto/create-addon.dto';

export class FilterDto {
  @ApiPropertyOptional({
    name: 'regionId',
    description: 'Filter by region UUID',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId: string;

  @ApiPropertyOptional({
    description: 'Filter by tag',
    example: 'candels',
    required: false,
  })
  @IsOptional()
  @IsString()
  tag: string;

  @ApiPropertyOptional({
    name: 'category',
    required: false,
    enum: AddonCategory,
    type: String,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsString()
  category: AddonCategory;

  @ApiPropertyOptional({
    name: 'isActive',
    required: false,
    enum: ['true', 'false'],
    type: String,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isActive: boolean;
}
