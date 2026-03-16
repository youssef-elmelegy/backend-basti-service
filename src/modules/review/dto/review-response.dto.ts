import { ApiProperty } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  orderId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  bakeryId: string;

  @ApiProperty({
    example: 5,
  })
  rating: number;

  @ApiProperty({
    example: 'The cake was delicious and beautifully decorated!',
  })
  reviewText: string;
}

export class ReviewDeleteResponseDto {
  @ApiProperty({
    example: 'Review deleted successfully',
  })
  message: string;
}

export class BakeyReviewsResponseDto {
  @ApiProperty({
    type: [ReviewResponseDto],
    example: [
      {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        bakeryId: '550e8400-e29b-41d4-a716-446655440002',
        rating: 5,
        reviewText: 'The cake was delicious and beautifully decorated!',
      },
    ],
    description: 'List of reviews for the bakery',
  })
  reviews!: ReviewResponseDto[];

  @ApiProperty({
    example: 1,
    description: 'Total number of stars for the bakery',
  })
  averageRating!: number;
}
