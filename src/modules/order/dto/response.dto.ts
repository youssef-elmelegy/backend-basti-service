import { ApiProperty, OmitType } from '@nestjs/swagger';
import { orderStatusEnum, paymentMethodTypeEnum, CartTypeEnum } from '@/db/schema';
import { FeaturedCakeDataDto } from '@/modules/featured-cake/dto/featured-cake-response.dto';
import { SweetDataDto } from '@/modules/sweet/dto/sweet-response.dto';
import { AddonDataDto } from '@/modules/addon/dto/addon-response.dto';
import { PredesignedCakeDataDto } from '@/modules/custom-cakes/dto/predesigned-cake-response.dto';
import { CustomCakeConfig } from '@/modules/cart/dto';

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

export class UserDataDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export class LocationDataDto {
  label: string;
  latitude: number;
  longitude: number;
  buildingNo: string;
  street: string;
  description: string;
}

export class CardMessageDataDto {
  to: string;
  from: string;
  message: string;
  link: string;
}

export class RecipientDataDto {
  name: string;
  email: string;
  phoneNumber: string;
}

export class WantedDeliveryTimeSlotDateDto {
  from: string;
  to: string;
}

export class PaymentDataDto {
  type: string;
  cardHolderName: string;
  cardLastFourDigits: string;
  cardExpiryMonth: number;
  cardExpiryYear: number;
}

export class CreateOrderResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the order',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who placed the order',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  userId: string;

  @ApiProperty({
    description: 'User data snapshot at the time of order',
    type: UserDataDto,
    required: false,
  })
  userData?: UserDataDto;

  @ApiProperty({
    description: 'Assigned bakery ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  bakeryId?: string;

  @ApiProperty({
    description: 'Reference to the user saved location',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  locationId?: string;

  @ApiProperty({
    description: 'Location data snapshot at the time of order',
    type: LocationDataDto,
    required: false,
  })
  locationData?: LocationDataDto;

  @ApiProperty({
    description: 'Total price before discounts',
    example: 150.0,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Discount amount applied to the order',
    example: 10.0,
  })
  discountAmount: number;

  @ApiProperty({
    description: 'Final price after discounts',
    example: 140.0,
  })
  finalPrice: number;

  @ApiProperty({
    description: 'Reference to the user saved payment method',
    example: '550e8400-e29b-41d4-a716-446655440004',
    required: false,
  })
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Type of payment method used',
    enum: ['credit_card', 'debit_card', 'cash', 'wallet'],
    example: 'credit_card',
  })
  paymentMethodType: (typeof paymentMethodTypeEnum.enumValues)[number];

  @ApiProperty({
    description: 'Payment method data snapshot at the time of order',
    type: PaymentDataDto,
    required: false,
  })
  paymentData?: PaymentDataDto;

  @ApiProperty({
    description: 'Current status of the order',
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    example: 'pending',
  })
  orderStatus: (typeof orderStatusEnum.enumValues)[number];

  @ApiProperty({
    description: 'Special delivery instructions',
    example: 'Please ring the doorbell twice',
    required: false,
  })
  deliveryNote?: string;

  @ApiProperty({
    description: 'Whether to hide sender information from recipient',
    example: false,
  })
  keepAnonymous: boolean;

  @ApiProperty({
    description: 'Type of cart this order was created from',
    enum: ['big_cakes', 'small_cakes', 'others'],
    example: 'big_cakes',
  })
  cartType: (typeof CartTypeEnum.enumValues)[number];

  @ApiProperty({
    description: 'Card message details if the order includes a card message',
    type: CardMessageDataDto,
    example: {
      to: 'John Doe',
      from: 'Jane Doe',
      message: 'Happy Birthday!',
      link: 'https://example.com/card/abc123',
    },
    required: false,
  })
  cardMessage?: CardMessageDataDto;

  @ApiProperty({
    description: 'Recipient details',
    type: RecipientDataDto,
    example: {
      name: 'John Doe',
      email: 'john@test.com',
      phoneNumber: '+1234567890',
    },
    required: false,
  })
  recipientData?: RecipientDataDto;

  @ApiProperty({
    description: 'Recipient details',
  })
  wantedDeliveryDate?: Date;

  @ApiProperty({
    description: 'Recipient details',
    type: WantedDeliveryTimeSlotDateDto,
    example: {
      from: '14:00',
      to: '16:00',
    },
    required: false,
  })
  wantedDeliveryTimeSlot?: WantedDeliveryTimeSlotDateDto;

  @ApiProperty({
    description: 'Expected delivery date and time',
    example: '2025-12-25T14:00:00.000Z',
  })
  willDeliverAt: Date;

  @ApiProperty({
    description: 'Actual delivery date and time',
    example: '2025-12-25T14:30:00.000Z',
    required: false,
  })
  deliveredAt?: Date;

  @ApiProperty({
    description: 'Order creation timestamp',
    example: '2025-12-20T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Order last update timestamp',
    example: '2025-12-20T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'List of items in the order',
    type: [CreateOrderItemResponseDto],
    example: [],
  })
  items: CreateOrderItemResponseDto[];
}

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

export class OrderResponseDto extends OmitType(CreateOrderResponseDto, ['items'] as const) {
  @ApiProperty({
    description: 'List of addons in the order',
    type: [OrderItemResponseDto],
    example: [],
  })
  addons: OrderItemResponseDto<AddonDataDto>[];

  @ApiProperty({
    description: 'List of sweets in the order',
    type: [OrderItemResponseDto],
    example: [],
  })
  sweets: OrderItemResponseDto<SweetDataDto>[];

  @ApiProperty({
    description: 'List of featured cakes in the order',
    type: [OrderItemResponseDto],
    example: [],
  })
  featuredCakes: OrderItemResponseDto<FeaturedCakeDataDto>[];

  @ApiProperty({
    description: 'List of predesigned cakes in the order',
    type: [OrderItemResponseDto],
    example: [],
  })
  predesignedCakes: OrderItemResponseDto<PredesignedCakeDataDto>[];

  @ApiProperty({
    description: 'List of custom cakes in the order',
    type: [OrderItemResponseDto],
    example: [],
  })
  customCakes: OrderItemResponseDto<CustomCakeConfig>[];
}
