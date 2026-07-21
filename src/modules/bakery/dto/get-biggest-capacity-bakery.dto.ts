import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class GetBiggestCapacityBakeryDto {
  @ApiProperty({
    description: 'Type of cart',
    type: String,
    enum: ['big_cakes', 'small_cakes', 'others'],
  })
  @IsString()
  @IsEnum(['big_cakes', 'small_cakes', 'others'])
  cartType!: 'big_cakes' | 'small_cakes' | 'others';
}
