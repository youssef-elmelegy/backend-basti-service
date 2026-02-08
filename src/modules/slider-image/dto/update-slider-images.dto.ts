import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

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
}
