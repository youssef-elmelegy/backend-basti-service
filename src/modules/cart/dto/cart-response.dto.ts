import { ApiProperty } from '@nestjs/swagger';
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

export class CartItem<T> {
  id: string;
  quantity: number;
  isIncluded: boolean;
  type: ItemType;
  item: T;
}

export class CustomCakeConfig {
  @ApiProperty({ type: () => CakeConfigFlavorDto })
  flavor: CakeConfigFlavorDto;

  @ApiProperty({ type: () => CakeConfigDecorationDto })
  decoration: CakeConfigDecorationDto;

  @ApiProperty({ type: () => CakeConfigShapeDto })
  shape: CakeConfigShapeDto;

  @ApiProperty({ example: '#FF0000' })
  frostColorValue: string;
}

export class CustomCake {
  @ApiProperty({ type: () => CustomCakeConfig, isArray: true })
  configs: CustomCakeConfig[];
}

export class BigCakesCart {
  featuredCakes: CartItem<FeaturedCakeDataDto>[];
  predesignedCake: CartItem<PredesignedCakeDataDto>[];
  customCakes: CartItem<CustomCake>[];
}

export class SmallCakesCart {
  featuredCakes: CartItem<FeaturedCakeDataDto>[];
  predesignedCake: CartItem<PredesignedCakeDataDto>[];
  customCakes: CartItem<CustomCake>[];
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
