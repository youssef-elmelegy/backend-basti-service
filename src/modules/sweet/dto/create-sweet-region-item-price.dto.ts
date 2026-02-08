import { IsUUID, IsString, IsNotEmpty, Matches, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSweetRegionItemPriceDto {
  @ApiProperty({
    description: 'Sweet ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  sweetId: string;

  @ApiProperty({
    description: 'Region ID (UUID)',
    example: '660f9500-f39c-51e5-b826-557766551111',
  })
  @IsNotEmpty()
  @IsUUID()
  regionId: string;

  @ApiProperty({
    description: 'Price in EGP',
    example: '150.00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Price must be a valid decimal number with up to 2 decimal places',
  })
  price: string;

  @ApiPropertyOptional({
    description: 'Prices for each size',
    example: { Small: '100.00', Large: '200.00' },
  })
  @IsOptional()
  @IsObject()
  sizesPrices?: Record<string, string>;
}
