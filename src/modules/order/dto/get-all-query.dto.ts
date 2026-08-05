import { IsArray, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { OrderStatus } from './get.dto';

export class GetAllQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by region (UUID)' })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Filter by bakery (UUID)' })
  @IsOptional()
  @IsUUID()
  bakeryId?: string;

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
  status?: OrderStatus[] | string[];

  @ApiPropertyOptional({
    description: 'Sort by orderedAt (createdAt). asc = oldest first, desc = newest first.',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Filter by cart type (big_cakes, small_cakes, others, ...)',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description:
      "Filter by driver assignment state: 'unassigned' (no driver), 'assigned' (driver assigned, awaiting acceptance), 'accepted' (driver accepted).",
    enum: ['unassigned', 'assigned', 'accepted'],
  })
  @IsOptional()
  @IsIn(['unassigned', 'assigned', 'accepted'])
  driverState?: 'unassigned' | 'assigned' | 'accepted';
}
