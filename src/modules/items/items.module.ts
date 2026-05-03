import { Module } from '@nestjs/common';
import { ItemService } from './item.service';

@Module({
  controllers: [],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemsModule {}
