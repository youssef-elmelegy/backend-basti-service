import { SliderImageResponseDto } from './slider-image-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class SuccessSliderImagesResponseDto {
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
    example: 'Slider images retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing slider images array',
    type: [SliderImageResponseDto],
  })
  data: SliderImageResponseDto[];

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}

export class SuccessSliderImageMessageResponseDto {
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
    example: 'Slider images deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data with message',
  })
  data: { message: string };

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}
