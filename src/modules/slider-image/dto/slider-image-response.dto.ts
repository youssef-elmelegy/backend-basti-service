import { ApiProperty } from '@nestjs/swagger';

export class SliderImageResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the slider image',
    example: 'bb0e8400-e29b-41d4-a716-446655440007',
  })
  id: string;

  @ApiProperty({
    description: 'URL of the slider image',
    example: 'https://api.example.com/images/sliders/summer-collection.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-27T10:00:00.000Z',
  })
  createdAt: Date;
}
