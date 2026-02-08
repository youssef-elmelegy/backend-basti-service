import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddonRegionItemPriceDto {
  @ApiProperty({
    description: 'Add-on ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  addonId: string;

  @ApiProperty({
    description: 'Region ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    description: 'Price for the add-on in this region',
    example: '50',
  })
  @IsString()
  price: string;

  @ApiPropertyOptional({
    description: 'Prices for different sizes in this region',
    example: { small: '30', medium: '50', large: '70' },
    type: Object,
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  sizesPrices?: Record<string, string>;
}
