import { ApiProperty } from '@nestjs/swagger';
import { orderStatusEnum, paymentMethodTypeEnum, CartTypeEnum } from '@/db/schema';
import { FeaturedCakeDataDto } from '@/modules/featured-cake/dto/featured-cake-response.dto';
import { SweetDataDto } from '@/modules/sweet/dto/sweet-response.dto';
import { AddonDataDto } from '@/modules/addon/dto/addon-response.dto';
import { PredesignedCakeDataDto } from '@/modules/custom-cakes/dto/predesigned-cake-response.dto';
import { CustomCakeConfig } from '@/modules/cart/dto';

export class ChangeOrderStatusResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the order',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    enum: orderStatusEnum.enumValues,
    description: 'The new status of the order.',
  })
  status: (typeof orderStatusEnum.enumValues)[number];
}

export class OrderItemSelectedOptions {
  optionId: string;
  type: string;
  label: string;
  value: string;
}

export class OrderItemResponseDto<T> {
  id: string;
  orderId: string;
  quantity: number;
  size: string;
  flavor: string;
  price: number;
  selectedOptions: OrderItemSelectedOptions[];
  data: T;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderResponseDto {
  id: string;
  userId: string;
  bakeryId?: string;
  locationId: string;

  addons: OrderItemResponseDto<AddonDataDto>[];
  sweets: OrderItemResponseDto<SweetDataDto>[];
  featuredCakes: OrderItemResponseDto<FeaturedCakeDataDto>[];
  predesignedCakes: OrderItemResponseDto<PredesignedCakeDataDto>[];
  customCakes: OrderItemResponseDto<CustomCakeConfig>[];

  totalPrice: number;
  discountAmount: number;
  finalPrice: number;

  paymentMethodId: string;
  paymentMethodType: (typeof paymentMethodTypeEnum.enumValues)[number];

  orderStatus: (typeof orderStatusEnum.enumValues)[number];
  deliveryNote?: string;
  keepAnonymous: boolean;
  cartType: (typeof CartTypeEnum.enumValues)[number];

  cardMessage?: string;
  cardQrCodeUrl?: string;
  willDeliverAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateOrderItemResponseDto {
  id: string;
  orderId: string;
  addonId?: string;
  sweetId?: string;
  predesignedCakeId?: string;
  featuredCakeId?: string;
  customCake?: {
    shapeId: string;
    flavorId: string;
    decorationId: string;
    color: {
      name: string;
      hex: string;
    };
    extraLayers?: {
      layer: number;
      flavorId: string;
    }[];
    message?: string;
    imageToPrint?: string;
    snapshotFront?: string;
    snapshotTop?: string;
    snapshotSliced?: string;
  };
  quantity: number;
  size?: string;
  flavor?: string;
  price: string;
  selectedOptions?: {
    optionId: string;
    type: string;
    label: string;
    value: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export class CreateOrderResponseDto {
  id: string;
  discountAmount: number;
  totalPrice: number;
  finalPrice: number;
  orderStatus: (typeof orderStatusEnum.enumValues)[number];
  willDeliverAt: Date;
  createdAt: Date;
  items: CreateOrderItemResponseDto[];
}
