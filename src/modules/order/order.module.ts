import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { CartModule } from '../cart/cart.module';
import { ConfigModule } from '../config/config.module';
import { ItemService } from './services/item.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, ItemService],
  imports: [CartModule, ConfigModule],
  exports: [OrderService, ItemService],
})
export class OrderModule {}
