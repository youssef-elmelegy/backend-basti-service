import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum ShapeSortBy {
  CREATED_AT = 'createdAt',
  TITLE = 'title',
  UPDATED_AT = 'updatedAt',
}

export class GetShapesQueryDto {
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
