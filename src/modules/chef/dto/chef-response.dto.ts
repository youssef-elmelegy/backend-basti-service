import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class ChefBakeryDto {
  @ApiProperty({ example: MOCK_DATA.id.bakery })
  id: string;

  @ApiProperty({ example: MOCK_DATA.name.bakery })
  name: string;
}

export class ChefDataDto {
  @ApiProperty({ example: MOCK_DATA.id.chef })
  id: string;

  @ApiProperty({ example: MOCK_DATA.name.chef })
  name: string;

  @ApiProperty({ example: MOCK_DATA.image.chef })
  image: string;

  @ApiProperty({
    example:
      'Experienced pastry chef with 10 years of culinary expertise. Specializes in French pastries and cake decorations.',
  })
  bio: string;

  @ApiProperty({ type: ChefBakeryDto })
  bakery: ChefBakeryDto;

  @ApiProperty({ example: MOCK_DATA.numbers.rating })
  rating: number;

  @ApiProperty({ example: 10 })
  ratingCount: number;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  createdAt: string;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  updatedAt: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

export class PaginatedChefDataDto {
  @ApiProperty({ type: [ChefDataDto] })
  items: ChefDataDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

export class SuccessChefResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Chef retrieved successfully' })
  message: string;

  @ApiProperty({ type: ChefDataDto })
  data: ChefDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class SuccessChefsResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Chefs retrieved successfully' })
  message: string;

  @ApiProperty({ type: PaginatedChefDataDto })
  data: PaginatedChefDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class ChefRatingDataDto {
  @ApiProperty({ example: MOCK_DATA.id.chef })
  id: string;

  @ApiProperty({ example: MOCK_DATA.name.chef })
  name: string;

  @ApiProperty({ example: 4.9 })
  rating: number;

  @ApiProperty({ example: 11 })
  ratingCount: number;
}

export class SuccessChefRatingResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Chef rated successfully' })
  message: string;

  @ApiProperty({ type: ChefRatingDataDto })
  data: ChefRatingDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
