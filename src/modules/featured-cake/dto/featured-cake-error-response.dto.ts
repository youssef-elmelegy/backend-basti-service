import { ApiProperty } from '@nestjs/swagger';

export class FeaturedCakeErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  code: number;

  @ApiProperty({
    example: false,
    description: 'Response success status',
  })
  success: boolean;

  @ApiProperty({
    example: 'Featured cake with ID xxx not found',
    description: 'Error message or validation error details',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    example: 'BadRequestException',
    description: 'Error type',
  })
  error?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Response timestamp',
  })
  timestamp: string;
}
