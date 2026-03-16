import { Module } from '@nestjs/common';
import { BakeryService } from './services/bakery.service';
import { BakeryItemStoreService } from './services/bakery-item-store.service';
import { BakeryController } from './controllers/bakery.controller';

@Module({
  controllers: [BakeryController],
  providers: [BakeryService, BakeryItemStoreService],
  exports: [BakeryService, BakeryItemStoreService],
})
export class BakeryModule {}
