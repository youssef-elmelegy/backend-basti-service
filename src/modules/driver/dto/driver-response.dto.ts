import { ApiProperty } from '@nestjs/swagger';

export class DriverDataDto {
  @ApiProperty({
    example: '990e8400-e29b-41d4-a716-446655440004',
    description: 'Unique driver identifier (UUID)',
  })
  id!: string;

  @ApiProperty({ example: 'Driver', description: 'Driver name' })
  name?: string;

  @ApiProperty({
    example: 'driver@example.com',
    description: 'Driver email address',
  })
  email!: string;

  @ApiProperty({ example: '+1234567890', description: 'Driver phone number' })
  phoneNumber?: string;

  @ApiProperty({ example: 54, description: 'Driver due amount' })
  dueAmount?: number;

  @ApiProperty({
    example: 'driver',
    description: 'Driver role',
    enum: ['driver'],
  })
  role!: 'driver';

  @ApiProperty({
    example: null,
    description: 'Driver profile image URL',
    required: false,
    nullable: true,
  })
  profileImage?: string | null;

  @ApiProperty({
    example: null,
    description: 'Assigned bakery identifier (optional for drivers)',
    required: false,
    nullable: true,
  })
  bakeryId?: string | null;

  @ApiProperty({
    example: '990e8400-e29b-41d4-a716-446655440002',
    description: 'Region the driver is scoped to',
    required: false,
    nullable: true,
  })
  regionId?: string | null;

  @ApiProperty({
    example: false,
    description: 'Whether the driver is blocked',
  })
  isBlocked!: boolean;

  @ApiProperty({
    example: null,
    description: 'Timestamp when the driver was blocked',
    required: false,
    nullable: true,
  })
  blockedAt?: Date | null;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Driver creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Driver last update timestamp',
  })
  updatedAt!: Date;
}
