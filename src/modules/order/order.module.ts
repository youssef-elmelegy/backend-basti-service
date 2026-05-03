import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { CartModule } from '../cart/cart.module';
import { ConfigModule } from '../config/config.module';
import { StockService } from './services/stock.service';
import { SchedulerService } from './services/scheduler.service';
import { ItemsModule } from '../items/items.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService, StockService, SchedulerService],
  imports: [CartModule, ConfigModule, ItemsModule],
  exports: [OrderService, StockService, SchedulerService],
})
export class OrderModule {}
