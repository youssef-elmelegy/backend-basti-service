import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RegionQueryDto {
  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;
}
