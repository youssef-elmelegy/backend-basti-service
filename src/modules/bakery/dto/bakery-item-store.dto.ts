import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OptionsStockDto {
  @ApiProperty({
    description: 'ID of the product option',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsUUID()
  optionId!: string;

  @ApiProperty({
    description: 'Stock quantity for the specific product option',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiProperty({
    description: 'Label or display name of the option',
    example: 'Red',
    required: false,
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({
    description: 'Value of the option',
    example: '#FF0000',
    required: false,
  })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiProperty({
    description: 'Type of the option (color, number, letter, text)',
    example: 'color',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Image URL for the option',
    example: 'https://example.com/red.jpg',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string | null;
}

export class UpdateBakeryItemStockDto {
  @ApiProperty({
    description: 'Stock quantity for the product',
    example: '5',
  })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiProperty({
    description: 'Product options to update stock for',
    type: [OptionsStockDto],
    required: false,
    example: [
      {
        optionId: '550e8400-e29b-41d4-a716-446655440001',
        stock: 5,
      },
      {
        optionId: '550e8400-e29b-41d4-a716-446655440002',
        stock: 10,
      },
    ],
  })
  @Type(() => OptionsStockDto)
  @IsArray()
  @IsOptional()
  optionsStock?: OptionsStockDto[];
}

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  images: string[];
  type: 'addon' | 'sweet' | 'featured_cake';
}

export interface BakeryItemStoreDetailsDto {
  id: string;
  bakeryId: string;
  regionItemPriceId: string;
  stock: number;
  optionsStock?: OptionsStockDto[];
  price: string;
  sizesPrices?: Record<string, string>;
  addonId?: string;
  featuredCakeId?: string;
  sweetId?: string;
  decorationId?: string;
  flavorId?: string;
  shapeId?: string;
  predesignedCakeId?: string;
  product?: ProductInfo | null;
  createdAt: Date;
  updatedAt: Date;
}
