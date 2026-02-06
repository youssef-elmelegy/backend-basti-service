import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class CreateWishlistItemDto {
  @ApiProperty({ description: 'User ID owning this item' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Cake ID to add' })
  @IsOptional()
  @IsUUID()
  cakeId?: string;

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
  cakeId: string;

  @ApiProperty({ nullable: true })
  addonId: string;

  @ApiPropertyOptional()
  cakeName?: string;

  @ApiPropertyOptional()
  addonName?: string;

  @ApiProperty()
  createdAt: Date;
}
