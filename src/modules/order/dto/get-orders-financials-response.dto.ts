import { ApiProperty } from '@nestjs/swagger';

class OrderFinancialsRowDto {
  @ApiProperty()
  addonsTotal: number;

  @ApiProperty()
  bastiPercentage: number;

  @ApiProperty()
  bastiAmount: number;

  @ApiProperty()
  deliveryAmount: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty()
  bakeryId: string;

  @ApiProperty()
  bakeryName: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  referenceNumber: string;

  @ApiProperty()
  deliveredAt: Date;
}

class OrderFinancialsTotalDto {
  @ApiProperty()
  addonsTotal: number;

  @ApiProperty()
  bastiTotal: number;

  @ApiProperty()
  bakeryTotal: number;

  @ApiProperty()
  deliveryAmount: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  finalPrice: number;
}

class OrdersFinancialsPaginationDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}

export class GetOrdersFinancialsResponseDto {
  @ApiProperty({ type: [OrderFinancialsRowDto] })
  rows: OrderFinancialsRowDto[];

  @ApiProperty({ type: OrderFinancialsTotalDto })
  total: OrderFinancialsTotalDto;

  @ApiProperty({
    description: 'Pagination information',
    type: OrdersFinancialsPaginationDto,
  })
  pagination: OrdersFinancialsPaginationDto;
}
