import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { orderStatusEnum } from '@/db/schema';

export class ChangeOrderStatusDto {
  @ApiProperty({
    enum: orderStatusEnum.enumValues,
    description: 'The new status of the order.',
  })
  @IsNotEmpty()
  @IsEnum(orderStatusEnum.enumValues)
  status: (typeof orderStatusEnum.enumValues)[number];
}
