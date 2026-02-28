import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Length,
  IsEnum,
} from 'class-validator';

const paymentMethodTypes = ['credit_card', 'debit_card', 'cash', 'wallet'] as const;
type PaymentMethodType = (typeof paymentMethodTypes)[number];

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Type of payment method',
    enum: paymentMethodTypes,
    example: 'credit_card',
  })
  @IsEnum(paymentMethodTypes, {
    message: 'Type must be one of: credit_card, debit_card, cash, wallet',
  })
  @IsNotEmpty({ message: 'Payment method type is required' })
  type: PaymentMethodType;

  @ApiProperty({
    description: 'Name of the card holder',
    example: 'Ahmed Hassan',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Card holder name cannot be empty' })
  cardHolderName?: string;

  @ApiProperty({
    description: 'Last four digits of the card number',
    example: '4242',
    minLength: 4,
    maxLength: 4,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'Card last four digits must be exactly 4 characters' })
  cardLastFourDigits?: string;

  @ApiProperty({
    description: 'Card expiry month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Card expiry month must be an integer' })
  @Min(1, { message: 'Card expiry month must be at least 1' })
  @Max(12, { message: 'Card expiry month must be at most 12' })
  cardExpiryMonth?: number;

  @ApiProperty({
    description: 'Card expiry year (e.g., 2025)',
    example: 2025,
    minimum: 2024,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Card expiry year must be an integer' })
  @Min(2024, { message: 'Card expiry year must be at least 2024' })
  cardExpiryYear?: number;

  @ApiProperty({
    description: 'Whether this is the default payment method',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault must be a boolean' })
  isDefault?: boolean;
}
