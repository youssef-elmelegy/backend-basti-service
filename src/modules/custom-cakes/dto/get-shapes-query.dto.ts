import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';

export enum ShapeSortBy {
  CREATED_AT = 'createdAt',
  TITLE = 'title',
  UPDATED_AT = 'updatedAt',
}

export class GetShapesQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ShapeSortBy,
    example: ShapeSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ShapeSortBy)
  sortBy: ShapeSortBy = ShapeSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by region ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Search by title',
    example: 'round',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
