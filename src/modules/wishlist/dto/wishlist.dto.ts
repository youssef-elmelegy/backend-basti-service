import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class CreateWishlistItemDto {
  @ApiProperty({ description: 'User ID owning this item' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Featured Cake ID to add' })
  @IsOptional()
  @IsUUID()
  featuredCakeId?: string;

  @ApiPropertyOptional({ description: 'Addon ID to add' })
  @IsOptional()
  @IsUUID()
  addonId?: string;
}

export class WishlistItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ nullable: true })
  featuredCakeId: string;

  @ApiProperty({ nullable: true })
  addonId: string;

  @ApiPropertyOptional()
  cakeName?: string;

  @ApiPropertyOptional()
  addonName?: string;

  @ApiProperty()
  createdAt: Date;
}
