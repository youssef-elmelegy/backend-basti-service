import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeTagOrderDto {
  @ApiProperty({
    description: 'The new display order position for the tag',
    example: 2,
    type: 'integer',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  order: number;
}
