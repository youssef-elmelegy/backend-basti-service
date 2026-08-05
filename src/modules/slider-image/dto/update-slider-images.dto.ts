import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsNumber, Min, IsOptional, IsUUID } from 'class-validator';

export class SliderImageItemDto {
  @ApiPropertyOptional({
    description:
      'Existing slider image id. Provided to update that row in place; omit to create a new one.',
    example: 'bb0e8400-e29b-41d4-a716-446655440007',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    description:
      'Tag this image links to. Supplying one clears the hidden flag, which is the only way to unhide an image whose tag was deleted.',
    example: '550e8400-e29b-41d4-a716-446655441002',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  tagId?: string | null;

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
