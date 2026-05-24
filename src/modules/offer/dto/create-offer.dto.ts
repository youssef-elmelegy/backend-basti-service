import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  IsUUID,
  IsString,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({ example: 'Eid al-Fitr sales!' })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage for the offer (e.g., 10 for 10% off)',
  })
  @IsNumber()
  @Min(0)
  percentage!: number;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-20' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  addonId?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  featuredCakeId?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  sweetId?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  predesignedCakeId?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  decorationId?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  flavorId?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  shapeId?: string;
}
