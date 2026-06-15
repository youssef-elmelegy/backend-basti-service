import { ApiProperty } from '@nestjs/swagger';
import { DriverDataDto } from './driver-response.dto';

export class SuccessDriversResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success!: boolean;

  @ApiProperty({
    example: 'Drivers retrieved successfully',
    description: 'Success message',
  })
  message!: string;

  @ApiProperty({
    type: [DriverDataDto],
    description: 'List of drivers',
  })
  data!: DriverDataDto[];

  @ApiProperty({
    example: '2025-01-11T10:00:00.000Z',
    description: 'Response timestamp',
  })
  timestamp!: string;
}
