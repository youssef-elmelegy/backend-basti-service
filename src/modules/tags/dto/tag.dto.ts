import { ApiProperty } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty({
    description: 'Tag unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'A unique tag name',
    example: 'chocolate',
  })
  name: string;

  @ApiProperty({
    description: 'Display order of the tag',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Tag creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Tag last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
