import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class LocationDataDto {
  @ApiProperty({
    description: 'Location unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'A short label for the location (e.g. "Home", "Work")',
    example: 'Home',
  })
  label: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: '30.04441961',
  })
  latitude: string;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: '31.23571968',
  })
  longitude: string;

  @ApiProperty({
    description: 'Building number',
    example: '12A',
    nullable: true,
  })
  buildingNo: string | null;

  @ApiProperty({
    description: 'Street name',
    example: 'El-Maadi St',
  })
  street: string;

  @ApiProperty({
    description: 'Area name',
    example: 'Maadi',
  })
  area: string;

  @ApiProperty({
    description: 'Apartment number',
    example: '5',
    nullable: true,
  })
  apartmentNo: string | null;

  @ApiProperty({
    description: 'Office number',
    example: '12B',
    nullable: true,
  })
  officeNo: string | null;

  @ApiProperty({
    description: 'Floor',
    example: '3',
    nullable: true,
  })
  floor: string | null;

  @ApiProperty({
    description: 'Additional delivery information',
    example: 'Near the main gate',
    nullable: true,
  })
  additionalInfo: string | null;

  @ApiProperty({
    description: 'Location type',
    example: 'apartment',
    enum: ['house', 'apartment', 'office'],
  })
  type: 'house' | 'apartment' | 'office';

  @ApiProperty({
    description: 'Additional description or delivery instructions',
    example: 'Apartment 5, 3rd floor, next to the pharmacy',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Location creation timestamp',
    example: MOCK_DATA.dates.default,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Location last update timestamp',
    example: MOCK_DATA.dates.default,
  })
  updatedAt: Date;
}

export class SuccessLocationResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Request success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Location retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing location',
    type: LocationDataDto,
  })
  data: LocationDataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}

export class SuccessLocationsResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Request success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Locations retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing locations array',
    type: [LocationDataDto],
  })
  data: LocationDataDto[];

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}

export class DeleteLocationResponseDto {
  @ApiProperty({
    description: 'Deletion confirmation message',
    example: 'Location deleted successfully',
  })
  message: string;
}

export class SuccessDeleteLocationResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Request success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Location deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: DeleteLocationResponseDto,
  })
  data: DeleteLocationResponseDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}
