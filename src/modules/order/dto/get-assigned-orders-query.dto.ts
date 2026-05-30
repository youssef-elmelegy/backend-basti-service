import { IsArray, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatusEnum } from './get.dto';

/**
 * Query params for GET /orders/assigned — Kanban view feed.
 * Returns active orders grouped by bakeryId. Not paginated for now.
 */
export class GetAssignedOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Search query — matches reference number (substring, case-insensitive).',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Order statuses to include (comma-separated or repeated query param). Default: all active.',
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
    description: 'Sort by orderedAt (createdAt). asc = oldest first, desc = newest first.',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
