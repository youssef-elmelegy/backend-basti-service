import { ApiProperty } from '@nestjs/swagger';
import { CartTypeEnum } from '@/db/schema';

class OrderFinancialsRowDto {
  @ApiProperty()
  addonsTotal!: number;

  @ApiProperty()
  bastiPercentage!: number;

  @ApiProperty()
  bastiAmount!: number;

  @ApiProperty()
  deliveryAmount!: number;

  @ApiProperty()
  bastiDeliveryAmount!: number;

  @ApiProperty({ description: "Payment gateway: 'masarat' | 'tadawul' | '' (cash/wallet/unknown)" })
  gatewayName!: string;

  @ApiProperty()
  cartType!: string;

  @ApiProperty({
    description: 'Gateway fee (finalPriceBeforeGatewayFee * rate), deducted from Basti share',
  })
  gatewayFee!: number;

  @ApiProperty({ description: 'Total order price (excluding gateway fee)' })
  totalPrice!: number;

  @ApiProperty({
    description: 'Total discount amount applied to the order (excluding gateway fee)',
  })
  discountAmount!: number;

  @ApiProperty({ description: 'Sum of final price (excluding gateway fee)' })
  finalPriceBeforeGatewayFee!: number;

  @ApiProperty()
  finalPrice!: number;

  @ApiProperty()
  bakeryId!: string;

  @ApiProperty()
  bakeryName!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  referenceNumber!: string;

  @ApiProperty()
  orderStatus!: string | null;

  @ApiProperty({
    description: 'Type of cart this order was created from',
    enum: CartTypeEnum.enumValues,
    example: 'big_cakes',
  })
  cartType!: (typeof CartTypeEnum.enumValues)[number];

  @ApiProperty()
  deliveredAt!: Date | null;

  @ApiProperty()
  createdAt!: Date | null;
}

class OrderFinancialsTotalDto {
  @ApiProperty()
  addonsTotal!: number;

  @ApiProperty()
  miniCakesTotal!: number;

  @ApiProperty()
  bastiTotal!: number;

  @ApiProperty()
  bakeryTotal!: number;

  @ApiProperty()
  deliveryAmount!: number;

  @ApiProperty()
  bastiDeliveryAmount!: number;

  @ApiProperty({ description: 'Sum of gateway fees across all matched orders' })
  gatewayFeeTotal!: number;

  @ApiProperty()
  totalPrice!: number;

  @ApiProperty()
  discountAmount!: number;

  @ApiProperty({ description: 'Sum of final prices before gateway fees' })
  finalPriceBeforeGatewayFee!: number;

  @ApiProperty()
  finalPrice!: number;
}

class OrdersFinancialsPaginationDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  totalPages!: number;
}

export class GetOrdersFinancialsResponseDto {
  @ApiProperty({ type: [OrderFinancialsRowDto] })
  rows!: OrderFinancialsRowDto[];

  @ApiProperty({ type: OrderFinancialsTotalDto })
  total!: OrderFinancialsTotalDto;

  @ApiProperty({
    description: 'Pagination information',
    type: OrdersFinancialsPaginationDto,
  })
  pagination!: OrdersFinancialsPaginationDto;
}
