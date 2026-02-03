import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemOptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  optionId: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsString()
  value: string;
}

export class OrderItemDto {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  cakeId?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  addonId?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  flavor?: string;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemOptionDto)
  @IsOptional()
  selectedOptions?: OrderItemOptionDto[];
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'The ID of the location where the order will be placed.',
  })
  @IsNotEmpty()
  @IsUUID('4', { message: 'Invalid location ID' })
  locationId: string;

  @ApiProperty({
    description: 'The ID of the payment method to be used for the order.',
  })
  // @IsOptional()
  @IsUUID('4', { message: 'Invalid payment method ID' })
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'The discount amount to be applied to the order.',
  })
  @IsOptional()
  @IsDecimal()
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'The delivery note to be included with the order.',
  })
  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @ApiPropertyOptional({
    description: 'Whether the order should be kept anonymous or not.',
  })
  @IsBoolean()
  @IsOptional()
  keepAnonymous?: boolean;

  @ApiPropertyOptional({
    description: 'The message to be printed on the cake card.',
  })
  @IsString()
  @IsOptional()
  cardMessage?: string;

  @ApiPropertyOptional({
    description: 'The QR code URL to be printed on the cake card.',
  })
  @IsString()
  @IsOptional()
  cardQrCodeUrl?: string;

  @ApiProperty({
    description: 'The items to be included in the order.',
    example: [
      {
        cakeId: '123e4567-e89b-12d3-a456-426614174000',
        addonId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        size: 'medium',
        flavor: 'vanilla',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
