import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterDto {
  @ApiPropertyOptional({
    description: 'filter by region',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by tag name',
    example: 'chocolate',
    required: false,
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'vanilla',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
