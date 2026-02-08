import { ApiProperty } from '@nestjs/swagger';

export class SweetDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ nullable: true })
  tagId: string;

  @ApiProperty({ nullable: true })
  tagName?: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ type: [String] })
  sizes: string[];

  @ApiProperty({
    description: 'Price for the region (if filtered by region)',
    example: 150,
    required: false,
  })
  price?: string;

  @ApiProperty({
    description: 'Price for each size (if filtered by region)',
    example: { Small: 100, Large: 200 },
    required: false,
  })
  sizesPrices?: Record<string, string>;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SuccessSweetResponseDto {
  @ApiProperty()
  code: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: SweetDataDto;

  @ApiProperty()
  timestamp: string;
}

export class SuccessSweeetsResponseDto {
  @ApiProperty()
  code: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: [SweetDataDto] })
  data: SweetDataDto[];

  @ApiProperty()
  timestamp: string;
}

export class PaginationDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class GetAllSweetsDataDto {
  @ApiProperty({ type: [SweetDataDto] })
  items: SweetDataDto[];

  @ApiProperty()
  pagination: PaginationDto;
}

export class DeleteSweetResponseDto {
  @ApiProperty()
  message: string;
}

export class GetAllSweeetsResponseDto {
  @ApiProperty()
  code: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: GetAllSweetsDataDto;

  @ApiProperty()
  timestamp: string;
}
