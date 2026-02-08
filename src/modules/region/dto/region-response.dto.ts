import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class RegionDataDto {
  @ApiProperty({
    example: MOCK_DATA.id.region,
    description: 'Region unique identifier (UUID)',
  })
  id: string;

  @ApiProperty({
    example: MOCK_DATA.name.region,
    description: 'Region name',
  })
  name: string;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Region creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Region last update timestamp',
  })
  updatedAt: string;
}

export class SuccessRegionResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Region retrieved successfully' })
  message: string;

  @ApiProperty({ type: RegionDataDto })
  data: RegionDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class SuccessRegionsResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Regions retrieved successfully' })
  message: string;

  @ApiProperty({ type: [RegionDataDto] })
  data: RegionDataDto[];

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class RegionErrorResponseDto {
  @ApiProperty({ example: 404 })
  code: number;

  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Region not found' })
  message: string;

  @ApiProperty({ example: 'NotFoundException' })
  error?: string;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
