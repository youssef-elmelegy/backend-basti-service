import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum FlavorSortBy {
  CREATED_AT = 'createdAt',
  TITLE = 'title',
  UPDATED_AT = 'updatedAt',
}

export class GetFlavorsQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: FlavorSortBy,
    example: FlavorSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(FlavorSortBy)
  sortBy: FlavorSortBy = FlavorSortBy.CREATED_AT;

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
    description: 'Filter by shape ID - returns flavors with variant images for this shape only',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  shapeId?: string;

  @ApiPropertyOptional({
    description: 'Search by title',
    example: 'chocolate',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
