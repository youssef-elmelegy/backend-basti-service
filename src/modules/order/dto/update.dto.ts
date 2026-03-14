import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { orderStatusEnum } from '@/db/schema';

export class ChangeOrderStatusDto {
  @ApiProperty({
    enum: [...orderStatusEnum.enumValues, null],
    nullable: true,
    description: 'The new status of the order.',
  })
  @IsIn([...orderStatusEnum.enumValues, null])
  status!: (typeof orderStatusEnum.enumValues)[number] | null;
}
