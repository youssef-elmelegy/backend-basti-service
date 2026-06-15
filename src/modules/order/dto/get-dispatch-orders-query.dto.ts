import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dto/pagination.dto';

/**
 * Query params for GET /orders/dispatch — paginated driver-dispatch board.
 * Scope: orders that have been assigned to a bakery and are still active
 * (anything except delivered/cancelled), so an admin can assign a driver.
 */
export class GetDispatchOrdersQueryDto extends PaginationDto {
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
      "Filter by driver assignment state: 'unassigned' (no driver), 'assigned' (driver assigned, awaiting acceptance), 'accepted' (driver accepted).",
    enum: ['unassigned', 'assigned', 'accepted'],
  })
  @IsOptional()
  @IsIn(['unassigned', 'assigned', 'accepted'])
  driverState?: 'unassigned' | 'assigned' | 'accepted';

  @ApiPropertyOptional({
    description: 'Sort by createdAt. asc = oldest first, desc = newest first.',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
