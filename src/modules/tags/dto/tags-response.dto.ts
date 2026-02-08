import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';
import { TagDto } from './tag.dto';

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
    type: [TagDto],
  })
  data: TagDto[];

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}

export class SuccessTagResponseDto {
  @ApiProperty({
    example: 201,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Tag created successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: TagDto,
    description: 'Response data containing the created tag',
  })
  data: TagDto;

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}

export class SuccessTagDeleteResponseDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: true,
    description: 'Whether the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Tag deleted successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing success message',
    example: { message: 'Tag deleted successfully' },
  })
  data: { message: string };

  @ApiProperty({
    example: MOCK_DATA.dates.default,
    description: 'Response timestamp',
  })
  timestamp: string;
}
