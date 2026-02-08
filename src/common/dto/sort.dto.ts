import { IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SORT_DEFAULTS } from '@/constants/global.constants';

export type SortType = 'created_at' | 'alpha';
export type SortOrder = 'asc' | 'desc';

export class SortDto {
  @ApiProperty({
    description: 'Sorting type',
    example: 'created_at',
    enum: ['created_at', 'alpha'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['created_at', 'alpha'])
  @Type(() => String)
  sort?: SortType;

  @ApiProperty({
    description: 'Sorting order',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @Type(() => String)
  order?: SortOrder;

  constructor() {
    this.sort = this.sort ?? SORT_DEFAULTS.SORT;
    this.order = this.order ?? SORT_DEFAULTS.ORDER;
  }
}
