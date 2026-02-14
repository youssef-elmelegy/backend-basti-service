import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DesignedCakeConfigRequestDto } from './designed-cake-config.dto';

export class CreatePredesignedCakeDto {
  @ApiProperty({
    description: 'Name of the predesigned cake',
    example: 'Classic Chocolate Elegance',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the predesigned cake',
    example: 'A beautiful chocolate cake with chocolate frosting and elegant decorations',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

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
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignedCakeConfigRequestDto)
  @ArrayMinSize(1)
  configs: DesignedCakeConfigRequestDto[];
}
