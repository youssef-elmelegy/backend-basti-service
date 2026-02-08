import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';

export class PaginationDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  constructor() {
    this.page = this.page ?? PAGINATION_DEFAULTS.PAGE;
    this.limit = this.limit ?? PAGINATION_DEFAULTS.LIMIT;
  }
}
