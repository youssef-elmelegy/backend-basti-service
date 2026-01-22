import { Module } from '@nestjs/common';
import { BakeryService } from './services/bakery.service';
import { BakeryController } from './controllers/bakery.controller';

@Module({
  controllers: [BakeryController],
  providers: [BakeryService],
  exports: [BakeryService],
})
export class BakeryModule {}
