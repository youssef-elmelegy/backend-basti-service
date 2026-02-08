import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AddonCategory } from '../dto/create-addon.dto';

export class FilterDto {
  @ApiPropertyOptional({
    name: 'regionId',
    description: 'Filter by region',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
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
    description: 'filter by category',
  })
  @IsOptional()
  isActive: boolean;
}
