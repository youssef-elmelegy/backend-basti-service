import { IsUUID, IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegionItemPriceDto {
  @ApiProperty({
    description: 'Featured cake ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  featuredCakeId: string;

  @ApiProperty({
    description: 'Region ID (UUID)',
    example: '660f9500-f39c-51e5-b826-557766551111',
  })
  @IsNotEmpty()
  @IsUUID()
  regionId: string;

  @ApiProperty({
    description: 'Price in EGP',
    example: '1500.00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Price must be a valid decimal number with up to 2 decimal places',
  })
  price: string;
}
