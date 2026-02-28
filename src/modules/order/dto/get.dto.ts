import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegionFilterDto {
  @ApiProperty({
    name: 'regionId',
    description: 'The unique identifier of the region for orders.',
  })
  @IsUUID()
  regionId: string;
}
