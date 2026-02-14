import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum DecorationSortBy {
  CREATED_AT = 'createdAt',
  TITLE = 'title',
  UPDATED_AT = 'updatedAt',
}

export class GetDecorationsQueryDto {
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
    enum: DecorationSortBy,
    example: DecorationSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(DecorationSortBy)
  sortBy: DecorationSortBy = DecorationSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by tag ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiPropertyOptional({
    description: 'Filter by region ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Search by title',
    example: 'roses',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
