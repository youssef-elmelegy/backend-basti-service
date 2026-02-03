import { Expose } from 'class-transformer';

export class OrderItemResponseDto {
  id: string;
  createdAt: Date;
  price: string;
  quantity: number;
  cakeId: string;
  addonId: string;
  orderId: string;
  size: string;
  flavor: string;
  selectedOptions: {
    optionId: string;
    type: string;
    label: string;
    value: string;
  }[];
}

export class OrderResponseDto {
  @Expose()
  id: string;

  @Expose()
  orderStatus: string;

  @Expose()
  totalPrice: string;

  @Expose()
  discountAmount: string;

  @Expose()
  finalPrice: string;

  @Expose()
  willDeliverAt: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  items: OrderItemResponseDto[];
}
