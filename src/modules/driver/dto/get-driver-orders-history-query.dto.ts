import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { OrderStatus } from '@/modules/order/dto/get.dto';

/**
 * Query params for GET /drivers/:id/orders — admin view of a driver's order
 * history across all statuses (paginated). Optional status/search/sort filters.
 */
export class GetDriverOrdersHistoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by reference number (case-insensitive substring).',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Statuses to include (comma-separated or repeated query param). Defaults to all statuses.',
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
