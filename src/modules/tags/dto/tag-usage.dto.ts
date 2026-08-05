import { ApiProperty } from '@nestjs/swagger';

export class TagUsageSliderImageDto {
  @ApiProperty({ example: 'bb0e8400-e29b-41d4-a716-446655440007' })
  id: string;

  @ApiProperty({ example: 'Summer Collection' })
  title: string;
}

/**
 * Impact report for deleting a tag.
 *
 * Returned by `GET /tags/:id/usage`, and also embedded in the 409 body when a
 * delete is attempted without `force`, so the dashboard can show the admin what
 * would change before they confirm.
 */
export class TagUsageDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655441002' })
  tagId: string;

  @ApiProperty({ example: 'popular' })
  tagName: string;

  @ApiProperty({ description: 'Sweets referencing this tag', example: 13 })
  sweets: number;

  @ApiProperty({ description: 'Add-ons referencing this tag', example: 4 })
  addons: number;

  @ApiProperty({ description: 'Decorations referencing this tag', example: 0 })
  decorations: number;

  @ApiProperty({ description: 'Predesigned cakes referencing this tag', example: 18 })
  predesignedCakes: number;

  @ApiProperty({ description: 'Featured cakes referencing this tag', example: 11 })
  featuredCakes: number;

  @ApiProperty({
    description: 'Total products whose tag will be cleared on force delete',
    example: 46,
  })
  totalProducts: number;

  @ApiProperty({
    description: 'Slider images that will be hidden on force delete',
    type: [TagUsageSliderImageDto],
  })
  sliderImages: TagUsageSliderImageDto[];

  @ApiProperty({
    description: 'True when nothing references this tag, so it can be deleted without force',
    example: false,
  })
  canDeleteSafely: boolean;
}
