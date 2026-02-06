import { ApiProperty } from '@nestjs/swagger';

export class UpdateSliderImagesDto extends Array<string> {
  @ApiProperty({
    description: 'Array of image URLs for the slider',
    type: [String],
    example: [
      'https://api.example.com/images/sliders/summer-collection.jpg',
      'https://api.example.com/images/sliders/winter-special.jpg',
    ],
  })
  declare: string[];
}
