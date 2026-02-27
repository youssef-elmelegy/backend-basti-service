import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

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
    description: 'Additional description or delivery instructions',
    example: 'Apartment 5, 3rd floor, next to the pharmacy',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
