import { Module } from '@nestjs/common';
import { WishlistItemsController } from './controllers/wishlist.controller';
import { WishlistItemsService } from './services/wishlist.service';

@Module({
  controllers: [WishlistItemsController],
  providers: [WishlistItemsService],
})
export class WishlistModule {}
