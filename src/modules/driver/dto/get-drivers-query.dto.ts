import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

/**
 * Query params for GET /drivers — paginated drivers table.
 * Filters: q (search by name/email/phone), isBlocked (banned state), regionId.
 */
export class GetDriversQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name, email or phone number (case-insensitive substring).',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by region (UUID).' })
  @IsOptional()
  @IsUUID('4', { message: 'regionId must be a valid UUID' })
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by blocked (banned) state.',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean({ message: 'isBlocked must be a boolean value' })
  isBlocked?: boolean;
}
