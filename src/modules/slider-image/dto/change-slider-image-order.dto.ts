import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeSliderImageOrderDto {
  @ApiProperty({
    description: 'New display order position for the slider image (starting from 1)',
    example: 3,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Display order must be a valid number' })
  @Min(1, { message: 'Display order must be at least 1' })
  displayOrder: number;
}
