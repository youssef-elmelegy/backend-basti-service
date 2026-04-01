import { IsArray, IsOptional, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QADto {
  @ApiProperty({
    name: 'finalImages',
    description: 'The final images of the order',
    required: true,
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  finalImages!: string[];

  @ApiProperty({
    name: 'notes',
    description: 'The notes of the order',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  notes?: string[];
}

export class FinalizeOrderDto {
  @ApiProperty({
    name: 'bakeryId',
    description: 'The unique identifier of the bakery to assign the order to.',
  })
  @IsUUID()
  bakeryId!: string;

  @ApiProperty({
    name: 'finalImages',
    description: 'The final images of the order',
    required: true,
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  finalImages!: string[];

  @ApiProperty({
    name: 'notes',
    description: 'The notes of the order',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  notes?: string[];
}

export class FinalizeOrderResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the order',
  })
  id!: string;

  @ApiProperty({
    description: 'The unique identifier of the assigned bakery',
  })
  bakeryId!: string;

  @ApiProperty({
    description: 'The QA details of the order',
    type: QADto,
  })
  qa!: QADto;
}
