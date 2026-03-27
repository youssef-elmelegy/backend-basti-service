import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { CartModule } from '../cart/cart.module';
import { ConfigModule } from '../config/config.module';
import { ItemService } from './services/item.service';
import { StockService } from './services/stock.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, ItemService, StockService],
  imports: [CartModule, ConfigModule],
  exports: [OrderService, ItemService, StockService],
})
export class OrderModule {}
