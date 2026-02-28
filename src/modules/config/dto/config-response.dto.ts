import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';
import { EmergencyClosureDto } from './update-config.dto';

export class ConfigResponseDto {
  @ApiProperty({
    description: 'Config unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Hour the bakery opens (0-23)',
    example: 10,
  })
  openingHour: number;

  @ApiProperty({
    description: 'Hour the bakery closes (0-23)',
    example: 18,
  })
  closingHour: number;

  @ApiProperty({
    description: 'Minimum hours needed to prepare an order',
    example: 24,
  })
  minHoursToPrepare: number;

  @ApiProperty({
    description: 'Days of the week that are weekends (0=Sunday, 6=Saturday)',
    example: [5, 6],
    type: [Number],
  })
  weekendDays: number[];

  @ApiProperty({
    description: 'List of holiday dates in ISO format (YYYY-MM-DD)',
    example: ['2025-01-01', '2025-04-21'],
    type: [String],
  })
  holidays: string[];

  @ApiProperty({
    description: 'Emergency closure date ranges with reasons',
    type: [EmergencyClosureDto],
  })
  emergencyClosures: { from: string; to: string; reason: string }[];

  @ApiProperty({
    description: 'Whether the bakery is currently open for orders',
    example: true,
  })
  isOpen: boolean;

  @ApiProperty({
    description: 'Message shown to users when the bakery is closed',
    example: 'We are currently closed for maintenance. We will be back soon!',
    nullable: true,
  })
  closureMessage: string;

  @ApiProperty({
    description: 'Config creation timestamp',
    example: MOCK_DATA.dates.default,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Config last update timestamp',
    example: MOCK_DATA.dates.default,
  })
  updatedAt: Date;
}

export class SuccessConfigResponseDto {
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
    example: 'Config retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing the app config',
    type: ConfigResponseDto,
  })
  data: ConfigResponseDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}
