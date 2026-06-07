import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyDeliveryCodeDto {
  @ApiProperty({
    example: '123456',
    description: 'Delivery verification code provided by the driver',
  })
  @IsString({ message: 'deliveryCheckCode must be a string' })
  @Length(6, 6, { message: 'deliveryCheckCode must be exactly 6 digits' })
  deliveryCheckCode: string;
}
