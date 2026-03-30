export interface AddonOptionData {
  id: string;
  type: string;
  label: string;
  value: string;
  imageUrl: string;
  quantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddonData {
  id: string;
  selectedOptionId?: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  tagId: string;
  tagName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  options: AddonOptionData[];
  price?: string;
  sizesPrices?: Record<string, string>;
  quantity?: number;
}

export interface SweetData {
  id: string;
  name: string;
  description: string;
  tagId: string;
  tagName: string;
  images: string[];
  sizes: string[];
  isActive: boolean;
  price?: string;
  sizesPrices?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  quantity?: number;
}

export interface FeaturedCakeData {
  id: string;
  name: string;
  description: string;
  images: string[];
  capacity: number;
  flavorList: string[];
  pipingPaletteList: string[];
  tagId: string;
  tagName: string;
  isActive: boolean;
  price?: string;
  sizesPrices?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  quantity?: number;
}

export interface ShapeVariantImages {
  id: string;
  slicedViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlavorData {
  id: string;
  title: string;
  description: string;
  flavorUrl: string;
  isActive: boolean;
  order: number;
  shapeVariantImages: ShapeVariantImages[];
  price?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecorationData {
  id: string;
  title: string;
  description: string;
  tagId: string;
  tagName: string;
  decorationUrl: string;
  isActive: boolean;
  shapeVariantImages: ShapeVariantImages[];
  price?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShapeData {
  id: string;
  title: string;
  description: string;
  shapeUrl: string;
  isActive: boolean;
  capacity: number;
  order: number;
  size: string;
  price?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredesignedCakeConfigData {
  id: string;
  predesignedCakeId?: string;
  shape: ShapeData;
  flavor: FlavorData;
  decoration: DecorationData;
  frostColorValue: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredesignedCakeData {
  id: string;
  name: string;
  description: string;
  tagId: string;
  tagName: string;
  isActive: boolean;
  thumbnailUrl: string;
  configs: PredesignedCakeConfigData[];
  totalCapacity?: number;
  price?: string;
  sizesPrices?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  quantity?: number;
}

export interface ColorConfigData {
  name: string;
  hex: string;
}

export interface ExtraLayerData {
  layer: number;
  flavor: FlavorData;
}

export interface CustomCakeData {
  id?: string;
  shape: ShapeData;
  flavor: FlavorData;
  decoration: DecorationData;
  color: ColorConfigData;
  extraLayers: ExtraLayerData[];
  message: string;
  imageToPrint: string;
  snapshotFront: string;
  snapshotTop: string;
  snapshotSliced: string;
  totalCapacity?: number;
  price?: string;
  quantity?: number;
}

export interface CustomCakeFlattenData {
  shapeId: string;
  flavorId: string;
  decorationId: string;
  message?: string;
  color: {
    name: string;
    hex: string;
  };
  extraLayers?: {
    layer: number;
    flavorId: string;
  }[];
  imageToPrint?: string;
  snapshotFront?: string;
  snapshotTop?: string;
  snapshotSliced?: string;
}
