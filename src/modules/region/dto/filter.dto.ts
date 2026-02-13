import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterDto {
  @ApiPropertyOptional({
    name: 'isAvailable',
    required: false,
    enum: ['true', 'false'],
    type: String,
    description: 'Filter by availability status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isAvailable: boolean;
}
