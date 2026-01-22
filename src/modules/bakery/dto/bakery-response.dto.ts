import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class BakeryRegionDto {
  @ApiProperty({ example: MOCK_DATA.id.region })
  id: string;

  @ApiProperty({ example: MOCK_DATA.name.region })
  name: string;
}

export class BakeryDataDto {
  @ApiProperty({ example: MOCK_DATA.id.bakery })
  id: string;

  @ApiProperty({ example: MOCK_DATA.name.bakery })
  name: string;

  @ApiProperty({ example: '12 El-Maadi St, Cairo' })
  locationDescription: string;

  @ApiProperty({ example: MOCK_DATA.numbers.capacity })
  capacity: number;

  @ApiProperty({ example: MOCK_DATA.id.region })
  regionId: string;

  @ApiProperty({ type: [String], example: ['basket_cakes', 'medium_cakes', 'large_cakes'] })
  types: string[];

  @ApiProperty({ example: 4.5, nullable: true })
  averageRating: number;

  @ApiProperty({ example: 12 })
  totalReviews: number;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  createdAt: Date;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  updatedAt: Date;
}

export class SuccessBakeryResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bakery retrieved successfully' })
  message: string;

  @ApiProperty({ type: BakeryDataDto })
  data: BakeryDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class SuccessBakeriesResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bakeries retrieved successfully' })
  message: string;

  @ApiProperty({ type: [BakeryDataDto] })
  data: BakeryDataDto[];

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
