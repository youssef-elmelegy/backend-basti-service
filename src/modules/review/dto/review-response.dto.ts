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

export class UserReviewDto {
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    example: 'https://example.com/john.jpg',
    description: 'User profile image URL',
  })
  profileImage?: string;
}

export class BakeryReviewResponseDto extends ReviewResponseDto {
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    example: 'https://example.com/john.jpg',
    description: 'User profile image URL',
  })
  profileImage?: string;
}

export class PaginatedBakeyReviewsResponseDto {
  @ApiProperty({
    type: [BakeryReviewResponseDto],
    example: [
      {
        id: '69731d5e-27ca-48a8-acde-d2292750dee9',
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        bakeryId: '550e8400-e29b-41d4-a716-446655440002',
        rating: 5,
        reviewText: 'The cake was delicious and beautifully decorated!',
        firstName: 'John',
        lastName: 'Doe',
        profileImage: 'https://example.com/john.jpg',
      },
    ],
    description: 'List of reviews for the bakery with user information',
  })
  reviews!: BakeryReviewResponseDto[];

  @ApiProperty({
    example: 1,
    description: 'Average rating for the bakery',
  })
  averageRating!: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of reviews for the bakery',
  })
  totalReviews!: number;

  @ApiProperty({
    example: {
      total: 10,
      totalPages: 2,
      page: 1,
      limit: 10,
    },
  })
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}
