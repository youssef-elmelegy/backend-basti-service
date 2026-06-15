import { ApiProperty } from '@nestjs/swagger';

export class ReportUserDto {
  @ApiProperty({ example: 'John', description: 'Reporting user first name' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Reporting user last name' })
  lastName!: string;

  @ApiProperty({ example: '+201234567890', description: 'Reporting user phone number' })
  phoneNumber?: string | null;
}

export class ReportDataDto {
  @ApiProperty({ example: '990e8400-e29b-41d4-a716-446655440010', description: 'Report id' })
  id!: string;

  @ApiProperty({ description: 'Reporting user info', type: ReportUserDto })
  user!: ReportUserDto;

  @ApiProperty({ example: '990e8400-e29b-41d4-a716-446655440004', description: 'Driver id' })
  driverId!: string;

  @ApiProperty({ example: 'Driver was late', description: 'Report body' })
  reportBody!: string;

  @ApiProperty({ example: '2025-01-11T10:00:00.000Z', description: 'Report creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-11T10:00:00.000Z', description: 'Report update timestamp' })
  updatedAt!: Date;
}

export class SuccessReportsResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Reports retrieved successfully' })
  message!: string;

  @ApiProperty({ type: [ReportDataDto] })
  data!: ReportDataDto[];

  @ApiProperty({ example: '2025-01-11T10:00:00.000Z' })
  timestamp!: string;
}
