import { IsArray, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { OrderStatusEnum } from './get.dto';

/**
 * Query params for GET /orders/completed — paginated admin completed-orders table.
 * Default scope: orders that have reached a terminal state
 * (ready / out_for_delivery / delivered / cancelled).
 */
export class GetCompletedOrdersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by region (UUID)' })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Search query — matches reference number (substring, case-insensitive).',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Statuses to include (comma-separated or repeated query param). Defaults to all completed/terminal statuses.',
    isArray: true,
    enum: OrderStatusEnum,
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
  @IsEnum(OrderStatusEnum, { each: true })
  @Type(() => String)
  status?: OrderStatusEnum[];

  @ApiPropertyOptional({
    description: 'Sort by createdAt. asc = oldest first, desc = newest first.',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
