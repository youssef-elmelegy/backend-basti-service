import { ApiProperty } from '@nestjs/swagger';

export class ItemOfferDto {
  @ApiProperty({
    description: 'Offer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Offer name',
    example: 'Summer Sales',
  })
  name: string;

  @ApiProperty({
    description: 'Offer percentage',
    example: 10,
  })
  percentage: number;

  @ApiProperty({
    description: 'Offer expiry date',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  expiryDate: Date | null;
}
