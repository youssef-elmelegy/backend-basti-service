import { ApiProperty } from '@nestjs/swagger';
import { FeaturedCakeDataDto } from '@/modules/featured-cake/dto/featured-cake-response.dto';
import { SweetDataDto } from '@/modules/sweet/dto/sweet-response.dto';

export class WishlistResponseDto {
  @ApiProperty({
    description: 'Featured cakes in the wishlist',
  })
  featuredCakes: FeaturedCakeDataDto[];

  @ApiProperty({
    description: 'Sweets in the wishlist',
  })
  sweets: SweetDataDto[];
}
