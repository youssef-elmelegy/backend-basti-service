import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

const paymentMethodTypes = ['credit_card', 'debit_card', 'cash', 'wallet'] as const;

export class PaymentMethodDataDto {
  @ApiProperty({
    description: 'Payment method unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Type of payment method',
    enum: paymentMethodTypes,
    example: 'credit_card',
  })
  type: (typeof paymentMethodTypes)[number];

  @ApiProperty({
    description: 'Name of the card holder',
    example: 'Ahmed Hassan',
    nullable: true,
  })
  cardHolderName: string;

  @ApiProperty({
    description: 'Last four digits of the card number',
    example: '4242',
    nullable: true,
  })
  cardLastFourDigits: string;

  @ApiProperty({
    description: 'Card expiry month (1-12)',
    example: 12,
    nullable: true,
  })
  cardExpiryMonth: number;

  @ApiProperty({
    description: 'Card expiry year',
    example: 2025,
    nullable: true,
  })
  cardExpiryYear?: number;

  @ApiProperty({
    description: 'Whether this is the default payment method',
    example: true,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Payment method creation timestamp',
    example: MOCK_DATA.dates.default,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Payment method last update timestamp',
    example: MOCK_DATA.dates.default,
  })
  updatedAt: Date;
}

export class SuccessPaymentMethodResponseDto {
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
    example: 'Payment method retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing payment method',
    type: PaymentMethodDataDto,
  })
  data: PaymentMethodDataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}

export class SuccessPaymentMethodsResponseDto {
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
    example: 'Payment methods retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing payment methods array',
    type: [PaymentMethodDataDto],
  })
  data: PaymentMethodDataDto[];

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}

export class DeletePaymentMethodResponseDto {
  @ApiProperty({
    description: 'Deletion confirmation message',
    example: 'Payment method deleted successfully',
  })
  message: string;
}

export class SuccessDeletePaymentMethodResponseDto {
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
    example: 'Payment method deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: DeletePaymentMethodResponseDto,
  })
  data: DeletePaymentMethodResponseDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}
