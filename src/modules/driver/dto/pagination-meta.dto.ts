import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 42, description: 'Total number of matching records' })
  total!: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages!: number;

  @ApiProperty({ example: 1, description: 'Current page' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit!: number;
}
