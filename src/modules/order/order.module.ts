import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { CartModule } from '../cart/cart.module';
import { ConfigModule } from '../config/config.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [CartModule, ConfigModule],
  exports: [OrderService],
})
export class OrderModule {}
