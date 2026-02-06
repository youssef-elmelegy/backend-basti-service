import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterDto {
  @ApiProperty({
    description: 'filter by region',
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  regionId: string;

  @ApiProperty({
    description: 'Sorting order',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  tag: string;
}
