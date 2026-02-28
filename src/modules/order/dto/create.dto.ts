import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsUrl,
  IsNumber,
  IsEmail,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateLocationDto } from '@/modules/location/dto';
import { ItemType, allowedTypes } from '@/modules/cart/dto/create.dto';

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
    description: 'The ID of the location where the order will be placed.',
  })
  @IsUUID()
  locationId: string;

  @ApiProperty({
    description: 'The ID of the payment method to be used for the order.',
  })
  @IsUUID()
  paymentMethodId: string;

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
    description: 'The message to be printed on the cake card.',
    required: false,
  })
  @IsString()
  @IsOptional()
  cardMessage?: string;

  @ApiProperty({
    description: 'The QR code URL to be printed on the cake card.',
    required: false,
  })
  @IsString()
  @IsOptional()
  cardQrCodeUrl?: string;

  @ApiProperty({
    name: 'type',
    description: 'Type of item to add',
    example: 'big_cakes',
    enum: allowedTypes,
  })
  @IsIn(allowedTypes, { message: `Type must be one of: ${allowedTypes.join(', ')}` })
  type: ItemType;
}

export class CreateGuestOrderDto {
  @ApiProperty({
    description: 'The ID of the location where the order will be placed.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({
    description:
      'The location details for the order. This is required if locationId is not provided.',
    type: () => CreateLocationDto,
  })
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto;

  @ApiProperty({
    description: 'The ID of the payment method to be used for the order.',
  })
  // @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiProperty({
    description: 'The full name of the person placing the order.',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'The full name of the person placing the order.',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'The email address of the person placing the order.',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'The discount amount to be applied to the order.',
  })
  @IsOptional()
  @IsDecimal()
  discountAmount?: number;

  @ApiProperty({
    description: 'The delivery note to be included with the order.',
  })
  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @ApiProperty({
    description: 'Whether the order should be kept anonymous or not.',
  })
  @IsBoolean()
  @IsOptional()
  keepAnonymous?: boolean;

  @ApiProperty({
    description: 'The message to be printed on the cake card.',
  })
  @IsString()
  @IsOptional()
  cardMessage?: string;

  @ApiProperty({
    description: 'The QR code URL to be printed on the cake card.',
  })
  @IsString()
  @IsOptional()
  cardQrCodeUrl?: string;

  @ApiProperty({
    description: 'The items to be included in the order.',
    example: [
      {
        featuredCakeId: '123e4567-e89b-12d3-a456-426614174000',
        addonId: '223e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        size: 'medium',
        flavor: 'vanilla',
      },
    ],
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
