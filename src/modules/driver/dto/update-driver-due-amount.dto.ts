import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UpdateDriverDueAmountDto {
  @ApiProperty({
    description: 'Driver due amount to set',
    example: 54.5,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Due amount must be a valid number' })
  @Min(0, { message: 'Due amount must be greater than or equal to 0' })
  dueAmount!: number;
}
