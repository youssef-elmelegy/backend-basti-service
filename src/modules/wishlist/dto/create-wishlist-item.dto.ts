import { ApiProperty } from '@nestjs/swagger';
import { FeaturedCakeDataDto } from '@/modules/featured-cake/dto/featured-cake-response.dto';
import { SweetDataDto } from '@/modules/sweet/dto/sweet-response.dto';

// export class CreateWishlistFeaturedCakeDto {

//   @ApiPropertyOptional({
//     name: 'featuredCakeId',
//     description: 'Featured Cake ID to add',
//     required: false,
//   })
//   @IsOptional()
//   @IsUUID()
//   featuredCakeId?: string;
// }

// export class CreateWishlistSweetDto {

//   @ApiPropertyOptional({
//     name: 'sweetId',
//     description: 'Sweet ID to add',
//     required: false,
//   })
//   @IsOptional()
//   @IsUUID()
//   sweetId?: string;
// }

export class CreateWishlistFeaturedCakeResponseDto {
  @ApiProperty({
    description: 'Wishlist item Id',
  })
  wishlistItemId: string;

  @ApiProperty({
    description: 'Featured cake data in the wishlist',
  })
  featuredCake: FeaturedCakeDataDto;

  @ApiProperty({
    description: 'Wishlist item creation timestamp',
  })
  createdAt: string;
}

export class CreateWishlistSweetResponseDto {
  @ApiProperty({
    description: 'Wishlist item Id',
  })
  wishlistItemId: string;

  @ApiProperty({
    description: 'Sweet data in the wishlist',
  })
  sweet: SweetDataDto;

  @ApiProperty({
    description: 'Wishlist item creation timestamp',
  })
  createdAt: string;
}
