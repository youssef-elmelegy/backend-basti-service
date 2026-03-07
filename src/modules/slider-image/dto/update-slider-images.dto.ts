import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsNumber, Min } from 'class-validator';

export class SliderImageItemDto {
  @ApiProperty({
    description: 'Title of the slider image',
    example: 'Summer Collection',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'URL of the slider image',
    example: 'https://api.example.com/images/sliders/summer-collection.jpg',
  })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'Display order of the slider image (must be a positive integer)',
    example: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Display order must be at least 1' })
  displayOrder: number;
}
