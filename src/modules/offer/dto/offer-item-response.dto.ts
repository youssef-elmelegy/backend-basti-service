import { ApiProperty } from '@nestjs/swagger';

export type OfferItemType =
  | 'addon'
  | 'featuredCake'
  | 'sweet'
  | 'predesignedCake'
  | 'decoration'
  | 'flavor'
  | 'shape';

export class OfferItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  regionId: string;

  @ApiProperty({ example: 'Riyadh' })
  regionName: string;

  @ApiProperty({
    example: 'addon',
    enum: ['addon', 'featuredCake', 'sweet', 'predesignedCake', 'decoration', 'flavor', 'shape'],
  })
  type: OfferItemType;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001' })
  itemId: string;

  @ApiProperty({ example: 'Strawberry topping' })
  itemName: string;
}
