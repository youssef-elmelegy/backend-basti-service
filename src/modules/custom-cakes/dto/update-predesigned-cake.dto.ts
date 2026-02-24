import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DesignedCakeConfigRequestDto } from './designed-cake-config.dto';

export class UpdatePredesignedCakeDto {
  @ApiProperty({
    description: 'Name of the predesigned cake',
    example: 'Premium Chocolate Elegance',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the predesigned cake',
    example: 'A premium chocolate cake with premium chocolate frosting',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tag ID for categorization',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  tagId?: string;

  @ApiProperty({
    description: 'Cake configurations with flavor, decoration, and shape',
    type: [DesignedCakeConfigRequestDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignedCakeConfigRequestDto)
  @ArrayMinSize(1)
  @IsOptional()
  configs?: DesignedCakeConfigRequestDto[];
}
