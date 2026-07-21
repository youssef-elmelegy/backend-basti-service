import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export interface TadawulError {
  message: string;
  errors?: string[] | Record<string, string[]> | Record<string, string>;
}

export interface TadawulInitiatePaymentResponse {
  result: string;
  custom_ref: string;
  url: string;
}

export interface TadawulGetTransactionReceiptResponse {
  result: string;
  data?: {
    customer_phone: string;
    customer_email: string;
    customer_name: string;
    owner_name: string;
    shop_name: string;
    shop_logo: string;
    shop_url: string;
    owner_city: string;
    owner_phone: string;
    owner_email: string;
    amount: string;
    currency: string;
    gateway_name: 'edfaly' | 'tadawul' | 'sadad';
    gateway: string;
    gateway_ref: string;
    date_time: string;
    order_history: unknown[];
    notes_to_customer: Record<string, string> | string | null;
    notes_to_shop: Record<string, string> | string | null;
    reference: string;
  };
}

export class InitiatePaymentResponse {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  ref!: string;
}

class TransactionReceiptDataDto {
  @ApiProperty()
  customer_phone!: string;

  @ApiProperty()
  customer_email!: string;

  @ApiProperty()
  customer_name!: string;

  @ApiProperty()
  owner_name!: string;

  @ApiProperty()
  shop_name!: string;

  @ApiProperty()
  shop_logo!: string;

  @ApiProperty()
  shop_url!: string;

  @ApiProperty()
  owner_city!: string;

  @ApiProperty()
  owner_phone!: string;

  @ApiProperty()
  owner_email!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  gateway_name!: 'edfaly' | 'tadawul' | 'sadad';

  @ApiProperty()
  gateway!: string;

  @ApiProperty()
  gateway_ref!: string;

  @ApiProperty()
  date_time!: string;

  @ApiProperty()
  order_history!: unknown[];

  @ApiProperty()
  notes_to_customer!: Record<string, string> | string | null;

  @ApiProperty()
  notes_to_shop!: Record<string, string> | string | null;

  @ApiProperty()
  reference!: string;
}

export class GetTransactionReceiptResponse {
  @ApiProperty()
  result!: string;

  @ApiProperty()
  data?: TransactionReceiptDataDto;
}

export class ConfirmPaymentWebhookDto {
  @ApiProperty()
  @IsString()
  result!: string;

  @ApiProperty()
  @IsString()
  amount!: string;

  @ApiProperty()
  @IsString()
  store_id!: string;

  @ApiProperty()
  @IsString()
  our_ref!: string;

  @ApiProperty()
  @IsString()
  payment_method!: string;

  @ApiProperty()
  @IsString()
  customer_phone!: string;

  @ApiProperty()
  @IsString()
  custom_ref!: string;
}

export class TadawulInitiatePaymentDto {
  @ApiProperty({ description: 'Success URL', required: false })
  @IsOptional()
  successUrl?: string;

  @ApiProperty({ description: 'Failure URL', required: false })
  @IsOptional()
  failureUrl?: string;

  @ApiProperty({ description: 'Forced phone number (for testing)', required: false })
  @IsOptional()
  forcedPhoneNumber?: string;
}
