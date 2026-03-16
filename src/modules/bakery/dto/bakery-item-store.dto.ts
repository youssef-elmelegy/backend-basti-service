import { IsNumber, Min } from 'class-validator';

export class UpdateBakeryItemStockDto {
  @IsNumber()
  @Min(0)
  stock: number;
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
