import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, IsUUID, MaxLength, MinLength } from 'class-validator';
import { AddonOptionType } from './create-addon-option.dto';

export class UpdateAddonOptionDto {
  @ApiProperty({
    description: 'Option ID (if updating existing option)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'Option type. Ex: color, number, letter, text',
    example: 'color',
    enum: AddonOptionType,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(AddonOptionType)
  type?: AddonOptionType;

  @ApiProperty({
    description: 'Option label',
    example: 'Red',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label?: string;

  @ApiProperty({
    description: 'Option value',
    example: 'Red',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value?: string;

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
