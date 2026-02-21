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
} from 'class-validator';
import { Type } from 'class-transformer';
const allowedTypes = ['big_cakes', 'small_cakes', 'others'] as const;
export type ItemType = (typeof allowedTypes)[number];

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
    name: 'frostColorValue',
    description: 'Frost color value for the custom cake (e.g., hex code)',
  })
  @IsString()
  frostColorValue: string;
}

export class CreateFeaturedCakeItemDto {
  @ApiProperty({
    name: 'featuredCakeId',
    description: 'Featured Cake ID to add',
  })
  @IsUUID()
  featuredCakeId: string;

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

export class CreateAddonItemDto {
  @ApiProperty({
    name: 'addonId',
    description: 'Addon ID to add',
  })
  @IsUUID()
  addonId: string;

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

export class CreateSweetItemDto {
  @ApiProperty({
    name: 'sweetId',
    description: 'Sweet ID to add',
  })
  @IsUUID()
  sweetId: string;

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

export class CreateCustomCakeItemDto {
  @ApiProperty({
    name: 'customCakeConfigs',
    description: 'Custom cake to add',
    type: () => CustomCakeConfigDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomCakeConfigDto)
  customCakeConfigs: CustomCakeConfigDto[];

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

export class TypeQueryDto {
  @ApiProperty({
    name: 'type',
    description: 'Type of item to add',
    example: 'bigCakes',
    enum: allowedTypes,
  })
  @IsIn(allowedTypes, { message: `Type must be one of: ${allowedTypes.join(', ')}` })
  type: ItemType;
}
