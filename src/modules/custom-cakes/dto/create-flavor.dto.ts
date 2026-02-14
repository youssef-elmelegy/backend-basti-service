import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlavorDto {
  @ApiProperty({
    description: 'Flavor title',
    example: 'Chocolate',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Flavor description',
    example: 'Rich chocolate flavor with smooth texture',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Flavor image URL',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
  })
  @IsString()
  flavorUrl: string;
}
