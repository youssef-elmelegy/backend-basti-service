import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class SuccessTagsResponseDto {
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
    example: 'Tags retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing tags array',
    type: [String],
  })
  data: string[];

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}
