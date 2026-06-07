import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetDriverOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by assignment acceptance state (driverData presence).',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean({ message: 'isAssigned must be a boolean value' })
  isAssigned?: boolean;
}
