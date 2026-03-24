import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsLatitude,
  IsLongitude,
  IsEnum,
} from 'class-validator';

export enum LocationType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  OFFICE = 'office',
}

export class CreateLocationDto {
  @ApiProperty({
    description: 'A short label for the location (e.g. "Home", "Work")',
    example: 'Home',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Label is required' })
  @MaxLength(50, { message: 'Label must be at most 50 characters' })
  label: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 30.04441961,
  })
  @IsLatitude({ message: 'Latitude must be a valid latitude value' })
  @IsNotEmpty({ message: 'Latitude is required' })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 31.23571968,
  })
  @IsLongitude({ message: 'Longitude must be a valid longitude value' })
  @IsNotEmpty({ message: 'Longitude is required' })
  longitude: number;

  @ApiProperty({
    description: 'Building number',
    example: '12A',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Building number must be at most 50 characters' })
  buildingNo?: string;

  @ApiProperty({
    description: 'Street name',
    example: 'El-Maadi St',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Street is required' })
  @MaxLength(255, { message: 'Street must be at most 255 characters' })
  street: string;

  @ApiProperty({
    description: 'Area name',
    example: 'Maadi',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Area is required' })
  @MaxLength(255, { message: 'Area must be at most 255 characters' })
  area: string;

  @ApiProperty({
    description: 'Apartment number',
    example: '5',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Apartment number must be at most 50 characters' })
  apartmentNo?: string;

  @ApiProperty({
    description: 'Office number',
    example: '12B',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Office number must be at most 50 characters' })
  officeNo?: string;

  @ApiProperty({
    description: 'Floor',
    example: '3',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Floor must be at most 50 characters' })
  floor?: string;

  @ApiProperty({
    description: 'Additional delivery information',
    example: 'Near the main gate',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @ApiProperty({
    description: 'Location type',
    example: 'apartment',
    enum: LocationType,
  })
  @IsString()
  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(LocationType)
  type: LocationType;

  @ApiProperty({
    description: 'Additional description or delivery instructions',
    example: 'Apartment 5, 3rd floor, next to the pharmacy',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
