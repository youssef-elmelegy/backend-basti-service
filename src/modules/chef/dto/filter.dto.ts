import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FilterDto {
  @ApiProperty({
    description: 'filter by region',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;
}
