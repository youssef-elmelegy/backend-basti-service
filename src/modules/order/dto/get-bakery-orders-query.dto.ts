import { IsArray, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { OrderStatus } from './get.dto';

/**
 * Paginated query params for GET /orders/bakery/:bakeryId.
 * Same shape as the admin endpoints: page / limit / q / sort / status[] / regionId.
 */
export class GetBakeryOrdersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by region (UUID)' })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by cart type (big_cakes, small_cakes, others, ...)',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Search query — matches reference number (substring, case-insensitive).',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Statuses to include (comma-separated or repeated query param). Defaults to all statuses for the bakery.',
    isArray: true,
    enum: OrderStatus,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): string[] | undefined => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return undefined;
  })
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  @Type(() => String)
  status?: OrderStatus[];

  @ApiPropertyOptional({
    description: 'Sort by createdAt. asc = oldest first, desc = newest first.',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
