import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SORT_DEFAULTS } from '@/constants/global.constants';

type SortType = 'created_at' | 'alpha';
type SortOrder = 'asc' | 'desc';

export class SortDto {
  @ApiProperty({
    description: 'Sorting type',
    example: 'created_at',
    enum: ['created_at', 'alpha'],
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  sort: SortType = SORT_DEFAULTS.SORT;

  @ApiProperty({
    description: 'Sorting order',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  order: SortOrder = SORT_DEFAULTS.ORDER;
}
