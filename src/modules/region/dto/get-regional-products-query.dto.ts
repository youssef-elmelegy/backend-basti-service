import { IsOptional, IsEnum, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@/common/dto';
import { ApiProperty } from '@nestjs/swagger';

export enum ProductTypeFilter {
  FEATURED_CAKE = 'featured-cakes',
  ADDON = 'addons',
  FLAVOR = 'flavors',
  SHAPE = 'shapes',
  DECORATION = 'decorations',
  SWEET = 'sweets',
  PREDESIGNED_CAKE = 'predesigned-cakes',
}

export class GetRegionalProductsQueryDto extends PaginationDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ProductTypeFilter, { each: true })
  @Transform(({ value }): ProductTypeFilter[] => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim() as ProductTypeFilter);
    }
    return value as ProductTypeFilter[];
  })
  @ApiProperty({
    description: 'Filter by product types (comma-separated or array)',
    example: 'featured-cakes,sweets,addons',
    required: false,
    type: [String],
    enum: Object.values(ProductTypeFilter),
  })
  types?: ProductTypeFilter[];
}
