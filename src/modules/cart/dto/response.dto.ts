import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';
import { FeaturedCakeDataDto } from '@/modules/featured-cake/dto/featured-cake-response.dto';
import { SweetDataDto } from '@/modules/sweet/dto/sweet-response.dto';
import { AddonDataDto } from '@/modules/addon/dto/addon-response.dto';
import {
  PredesignedCakeDataDto,
  CakeConfigFlavorDto,
  CakeConfigDecorationDto,
  CakeConfigShapeDto,
} from '@/modules/custom-cakes/dto/predesigned-cake-response.dto';
import { ItemType } from '.';
import { FlavorDataDto } from '@/modules/custom-cakes/dto';

export class CartItem<T> {
  id: string;
  quantity: number;
  isIncluded: boolean;
  type: ItemType;
  unitPrice: number;
  totalPrice: number;
  // region: string;
  item: T;
}

class ColorConfigDto {
  @ApiProperty({
    description: 'Name of the color',
    example: 'Red',
  })
  name: string;

  @ApiProperty({
    name: 'hex',
    description: 'Hex code of the color',
  })
  hex: string;
}

class ExtraLayerConfigDto {
  @ApiProperty({
    description: 'Layer number for the extra layer',
  })
  layer: number;

  @ApiProperty({
    description: 'Flavor data for the extra layer',
    type: () => FlavorDataDto,
  })
  flavor: FlavorDataDto;
}

export class CustomCakeConfig {
  @ApiProperty({
    description: 'Shape data for the custom cake',
    type: () => CakeConfigShapeDto,
  })
  shape: CakeConfigShapeDto;

  @ApiProperty({
    description: 'Flavor data for the custom cake',
    type: () => CakeConfigFlavorDto,
  })
  flavor: CakeConfigFlavorDto;

  @ApiProperty({
    description: 'Decoration data for the custom cake',
    type: () => CakeConfigDecorationDto,
  })
  decoration: CakeConfigDecorationDto;

  @ApiProperty({
    description: 'Custom message to be written on the cake',
  })
  message: string;

  @ApiProperty({
    description: 'Color configuration for the custom cake',
    type: () => ColorConfigDto,
  })
  color: ColorConfigDto;

  @ApiProperty({
    description: 'Extra layers configuration for the custom cake',
    type: () => ExtraLayerConfigDto,
    isArray: true,
  })
  extraLayers: ExtraLayerConfigDto[];

  @ApiProperty({ description: 'Cloudinary URL for the printed image' })
  imageToPrint: string;

  @ApiProperty({ description: 'Cloudinary URL for the front snapshot' })
  snapshotFront: string;

  @ApiProperty({ description: 'Cloudinary URL for the top snapshot' })
  snapshotTop: string;

  @ApiProperty({ description: 'Cloudinary URL for the sliced snapshot' })
  snapshotSliced: string;
}

export class BigCakesCart {
  featuredCakes: CartItem<FeaturedCakeDataDto>[];
  predesignedCake: CartItem<PredesignedCakeDataDto>[];
  customCakes: CartItem<CustomCakeConfig>[];
  addons: CartItem<AddonDataDto>[];
}

export class SmallCakesCart {
  featuredCakes: CartItem<FeaturedCakeDataDto>[];
  predesignedCake: CartItem<PredesignedCakeDataDto>[];
  customCakes: CartItem<CustomCakeConfig>[];
  addons: CartItem<AddonDataDto>[];
}

export class OthersCart {
  sweets: CartItem<SweetDataDto>[];
  addons: CartItem<AddonDataDto>[];
}

export class CartResponseDto {
  @ApiProperty({
    name: 'bigCakes',
    description: 'Big cakes in the cart',
    type: () => BigCakesCart,
  })
  bigCakes: BigCakesCart;

  @ApiProperty({
    name: 'smallCakes',
    description: 'Small cakes in the cart',
    type: () => SmallCakesCart,
  })
  smallCakes: SmallCakesCart;

  @ApiProperty({
    name: 'others',
    description: 'Other items (sweets and addons) in the cart',
    type: () => OthersCart,
  })
  others: OthersCart;
}

export class SuccessCartResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Request success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Cart items retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing cart grouped by category',
    type: CartResponseDto,
  })
  data: CartResponseDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}
