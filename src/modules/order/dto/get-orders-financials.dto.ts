import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@/common/dto';

export class GetOrdersFinancialsDto extends PaginationDto {
  @ApiProperty({
    description: 'Return every matching row, ignoring page/limit. Used by the finance PDF export.',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  all?: boolean;

  @ApiProperty({ description: 'Filter by bakery ID' })
  @IsOptional()
  @IsUUID()
  bakeryId?: string;

  @ApiProperty({
    description: 'filter order from a specific date',
    example: '2026-05-20',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    description: 'filter order to a specific date',
    example: '2026-06-20',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
