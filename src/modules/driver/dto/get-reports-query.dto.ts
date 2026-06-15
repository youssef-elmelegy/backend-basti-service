import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

/**
 * Query params for the paginated driver-report tables
 * (GET /drivers/reports and GET /drivers/:id/reports).
 */
export class GetReportsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search report body (case-insensitive substring).',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Sort by createdAt. asc = oldest first, desc = newest first.',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
