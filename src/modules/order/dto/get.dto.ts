import { IsUUID, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum OrderStatus {
  NULL = 'null',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export class RegionFilterDto {
  @ApiProperty({
    name: 'regionId',
    description: 'The unique identifier of the region for orders.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({
    name: 'status',
    description: 'Filter orders by one or multiple statuses (comma-separated).',
    required: false,
    isArray: true,
    enum: OrderStatus,
    example: 'pending,confirmed',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  @Type(() => String)
  status?: OrderStatus[];
}
