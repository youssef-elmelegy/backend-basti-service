import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';

export class PaginationDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = PAGINATION_DEFAULTS.PAGE;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(PAGINATION_DEFAULTS.MAX_LIMIT, {
    message: `Limit must not exceed ${PAGINATION_DEFAULTS.MAX_LIMIT}`,
  })
  limit?: number = PAGINATION_DEFAULTS.LIMIT;
}
