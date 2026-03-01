import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsUrl,
  IsNumber,
  IsIn,
  IsEmail,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateLocationDto } from '@/modules/location/dto';
import { CreatePaymentMethodDto } from '@/modules/payment-method/dto';
import { ItemType, allowedTypes } from '@/modules/cart/dto/create.dto';

export class UserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'firstName must be at least 2 characters long' })
  @MaxLength(100, { message: 'firstName must not exceed 100 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'lastName must be at least 2 characters long' })
  @MaxLength(100, { message: 'lastName must not exceed 100 characters' })
  lastName: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber: string;
}

export class CardMessageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  to: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  from: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  link: string;
}

export class RecipientDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber: string;
}

export class WantedDeliveryTimeSlotDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  from: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  to: string;
}

export class ColorConfigDto {
  @ApiProperty({
    name: 'name',
    description: 'Name of the color',
    example: 'Red',
  })
  @IsString()
  name: string;

  @ApiProperty({
    name: 'hex',
    description: 'Hex code of the color',
    example: '#FF0000',
  })
  @IsString()
  hex: string;
}

export class ExtraLayerConfigDto {
  @ApiProperty({
    name: 'layer',
    description: 'Layer number for the extra layer',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Layer number must be at least 1' })
  layer: number;

  @ApiProperty({
    name: 'flavorId',
    description: 'Flavor ID for the extra layer',
  })
  @IsUUID()
  flavorId: string;
}

export class CustomCakeConfigDto {
  @ApiProperty({
    name: 'shapeId',
    description: 'Shape ID for the custom cake',
  })
  @IsUUID()
  shapeId: string;

  @ApiProperty({
    name: 'flavorId',
    description: 'Flavor ID for the custom cake',
  })
  @IsUUID()
  flavorId: string;

  @ApiProperty({
    name: 'decorationId',
    description: 'Decoration ID for the custom cake',
  })
  @IsUUID()
  decorationId: string;

  @ApiProperty({
    name: 'message',
    description: 'Custom message to be written on the cake',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    name: 'color',
    description: 'Color configuration for the custom cake',
    type: () => ColorConfigDto,
  })
  @ValidateNested()
  @Type(() => ColorConfigDto)
  color: ColorConfigDto;

  @ApiProperty({
    name: 'extraLayers',
    description: 'Extra layers configuration for the custom cake',
    type: () => ExtraLayerConfigDto,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraLayerConfigDto)
  extraLayers?: ExtraLayerConfigDto[];

  @ApiProperty({ description: 'Cloudinary URL for the printed image', required: false })
  @IsOptional()
  @IsUrl()
  imageToPrint?: string;

  @ApiProperty({ description: 'Cloudinary URL for the front snapshot', required: false })
  @IsOptional()
  @IsUrl()
  snapshotFront?: string;

  @ApiProperty({ description: 'Cloudinary URL for the top snapshot', required: false })
  @IsOptional()
  @IsUrl()
  snapshotTop?: string;

  @ApiProperty({ description: 'Cloudinary URL for the sliced snapshot', required: false })
  @IsOptional()
  @IsUrl()
  snapshotSliced?: string;
}

export class OrderItemOptionDto {
  @ApiProperty({
    description: 'The unique identifier of the option',
  })
  @IsString()
  optionId: string;

  @ApiProperty({
    description: 'The type of the option',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'The label of the option',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'The value of the option',
  })
  @IsString()
  value: string;
}

export class OrderItemDto {
  @ApiProperty({
    description: 'The unique identifier of the featured cake to be ordered.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  featuredCakeId?: string;

  @ApiProperty({
    description: 'The unique identifier of the addon to be ordered.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  addonId?: string;

  @ApiProperty({
    description: 'The unique identifier of the sweet to be ordered.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sweetId?: string;

  @ApiProperty({
    description: 'The unique identifier of the predesigned cake to be ordered.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  predesignedCakeId?: string;

  @ApiProperty({
    description: 'Custom cake configuration to be ordered.',
    type: () => CustomCakeConfigDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomCakeConfigDto)
  customCakeConfig?: CustomCakeConfigDto;

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

  @ApiProperty({
    example: [
      {
        optionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'option',
        label: 'label',
        value: '10,00',
      },
    ],
    type: [OrderItemOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemOptionDto)
  @IsOptional()
  selectedOptions?: OrderItemOptionDto[];
}

export class CreateOrderDto {
  @ApiProperty({
    description:
      'The ID of the user placing the order. If not provided, the order will be placed for a guest user.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'User data to be used for the order. If userId is provided, this will be ignored.',
    type: () => UserDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  userData?: UserDto;

  @ApiProperty({
    description: 'The ID of the location where the order will be placed.',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiProperty({
    description:
      'Location data to be used for the order. If locationId is provided, this will be ignored.',
    type: () => CreateLocationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLocationDto)
  locationData?: CreateLocationDto;

  @ApiProperty({
    description: 'The ID of the payment method to be used for the order.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiProperty({
    description:
      'Payment method data to be used for the order. If paymentMethodId is provided, this will be ignored.',
    type: () => CreatePaymentMethodDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePaymentMethodDto)
  PaymentMethodData?: CreatePaymentMethodDto;

  @ApiProperty({
    description:
      'Order items data to be added for the order. If provided, the users saved cart on the db will be ignored.',
    type: () => [OrderItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItemsData?: OrderItemDto[];

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    description: 'The discount amount to be applied to the order.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiProperty({
    description: 'The delivery note to be included with the order.',
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @ApiProperty({
    description: 'Whether the order should be kept anonymous or not.',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  keepAnonymous?: boolean;

  @ApiProperty({
    description: 'Card message data to be included with the order.',
    required: false,
    type: () => CardMessageDto,
  })
  @ValidateNested()
  @Type(() => CardMessageDto)
  @IsOptional()
  cardMessage?: CardMessageDto;

  @ApiProperty({
    description: 'Recipient data to be included with the order.',
    required: false,
    type: () => RecipientDto,
  })
  @ValidateNested()
  @Type(() => RecipientDto)
  @IsOptional()
  recipientData?: RecipientDto;

  @ApiProperty({
    description: 'The wanted delivery date for the order.',
    example: '2025-12-25',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'wantedDeliveryDate must be a valid ISO 8601 date string' })
  wantedDeliveryDate?: string;

  @ApiProperty({
    description: 'The wanted delivery time slot for the delivery.',
    required: false,
    type: () => WantedDeliveryTimeSlotDto,
  })
  @ValidateNested()
  @Type(() => WantedDeliveryTimeSlotDto)
  @IsOptional()
  wantedDeliveryTimeSlot?: WantedDeliveryTimeSlotDto;

  @ApiProperty({
    name: 'type',
    description: 'Type of item to add',
    example: 'big_cakes',
    enum: allowedTypes,
  })
  @IsIn(allowedTypes, { message: `Type must be one of: ${allowedTypes.join(', ')}` })
  type: ItemType;
}
