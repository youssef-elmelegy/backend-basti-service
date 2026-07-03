import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  IsUUID,
} from 'class-validator';

export class GenerateCouponDto {
  @ApiProperty({ example: 'BASTY20' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Basty 20% off' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'percentage',
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
  })
  @IsString()
  @IsEnum(['percentage', 'fixed_amount', 'free_shipping'])
  discountType: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountValue?: number;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-20' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  usageLimitGlobal: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  usageLimitPerUser: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isGlobal: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;
}
