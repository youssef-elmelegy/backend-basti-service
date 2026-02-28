import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsBoolean,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmergencyClosureDto {
  @ApiProperty({
    description: 'Start date of the emergency closure (ISO format)',
    example: '2025-03-01',
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'End date of the emergency closure (ISO format)',
    example: '2025-03-03',
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Reason for the emergency closure',
    example: 'Scheduled maintenance',
  })
  @IsString()
  reason: string;
}

export class UpdateConfigDto {
  @ApiProperty({
    description: 'Hour the bakery opens (0-23)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Opening hour must be an integer' })
  @Min(0, { message: 'Opening hour must be between 0 and 23' })
  @Max(23, { message: 'Opening hour must be between 0 and 23' })
  openingHour?: number;

  @ApiProperty({
    description: 'Hour the bakery closes (0-23)',
    example: 18,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Closing hour must be an integer' })
  @Min(0, { message: 'Closing hour must be between 0 and 23' })
  @Max(23, { message: 'Closing hour must be between 0 and 23' })
  closingHour?: number;

  @ApiProperty({
    description: 'Minimum hours needed to prepare an order',
    example: 24,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Min hours to prepare must be an integer' })
  @Min(1, { message: 'Min hours to prepare must be at least 1' })
  minHoursToPrepare?: number;

  @ApiProperty({
    description: 'Days of the week that are weekends (0=Sunday, 6=Saturday)',
    example: [5, 6],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Each weekend day must be an integer' })
  @Min(0, { each: true, message: 'Weekend day must be between 0 and 6' })
  @Max(6, { each: true, message: 'Weekend day must be between 0 and 6' })
  weekendDays?: number[];

  @ApiProperty({
    description: 'List of holiday dates in ISO format (YYYY-MM-DD)',
    example: ['2025-01-01', '2025-04-21'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each holiday must be a date string' })
  holidays?: string[];

  @ApiProperty({
    description: 'Emergency closure date ranges with reasons',
    type: [EmergencyClosureDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyClosureDto)
  emergencyClosures?: { from: string; to: string; reason: string }[];

  @ApiProperty({
    description: 'Whether the bakery is currently open for orders',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isOpen must be a boolean' })
  isOpen?: boolean;

  @ApiProperty({
    description: 'Message shown to users when the bakery is closed',
    example: 'We are currently closed for maintenance. We will be back soon!',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Closure message must be at most 500 characters' })
  closureMessage?: string;
}
