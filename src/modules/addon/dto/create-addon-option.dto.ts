import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export enum AddonOptionType {
  COLOR = 'color',
  NUMBER = 'number',
  LETTER = 'letter',
  TEXT = 'text',
}

export class CreateAddonOptionDto {
  @ApiProperty({
    description: 'Option type. Ex: color, number, letter, text',
    example: 'color',
    enum: AddonOptionType,
  })
  @IsString()
  @IsEnum(AddonOptionType)
  type!: AddonOptionType;

  @ApiProperty({
    description: 'Option label',
    example: 'Red',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @ApiProperty({
    description: 'Option value',
    example: 'Red',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value!: string;

  @ApiProperty({
    description: 'Option image URL',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/addons/frosting.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;
}
