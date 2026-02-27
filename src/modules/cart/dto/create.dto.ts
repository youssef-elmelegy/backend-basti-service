import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  IsIn,
  IsString,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

const allowedTypes = ['big_cakes', 'small_cakes', 'others'] as const;
export type ItemType = (typeof allowedTypes)[number];

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

export class CreateFeaturedCakeItemDto {
  @ApiProperty({
    name: 'featuredCakeId',
    description: 'Featured Cake ID to add',
  })
  @IsUUID()
  featuredCakeId: string;

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the item to add',
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Whether the item is included in the cart or just saved for later',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  @ApiProperty({
    name: 'type',
    description: 'Type of item to add',
    example: 'big_cakes',
    enum: allowedTypes,
  })
  @IsIn(allowedTypes, { message: `Type must be one of: ${allowedTypes.join(', ')}` })
  type: ItemType;
}

export class CreateAddonItemDto {
  @ApiProperty({
    name: 'addonId',
    description: 'Addon ID to add',
  })
  @IsUUID()
  addonId: string;

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the item to add',
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Whether the item is included in the cart or just saved for later',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  @ApiProperty({
    name: 'type',
    description: 'Type of item to add',
    example: 'big_cakes',
    enum: allowedTypes,
  })
  @IsIn(allowedTypes, { message: `Type must be one of: ${allowedTypes.join(', ')}` })
  type: ItemType;
}

export class CreateSweetItemDto {
  @ApiProperty({
    name: 'sweetId',
    description: 'Sweet ID to add',
  })
  @IsUUID()
  sweetId: string;

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the item to add',
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Whether the item is included in the cart or just saved for later',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;
}

export class CreatePredesignedCakeItemDto {
  @ApiProperty({
    name: 'predesignedCakeId',
    description: 'Predesigned cake ID to add',
  })
  @IsUUID()
  predesignedCakeId: string;

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the item to add',
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Whether the item is included in the cart or just saved for later',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  @ApiProperty({
    name: 'type',
    description: 'Type of item to add',
    example: 'big_cakes',
    enum: allowedTypes,
  })
  @IsIn(allowedTypes, { message: `Type must be one of: ${allowedTypes.join(', ')}` })
  type: ItemType;
}

export class CreateCustomCakeItemDto extends CustomCakeConfigDto {
  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the item to add',
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Whether the item is included in the cart or just saved for later',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  @ApiProperty({
    name: 'type',
    description: 'Type of item to add',
    example: 'big_cakes',
    enum: allowedTypes,
  })
  @IsIn(allowedTypes, { message: `Type must be one of: ${allowedTypes.join(', ')}` })
  type: ItemType;
}
