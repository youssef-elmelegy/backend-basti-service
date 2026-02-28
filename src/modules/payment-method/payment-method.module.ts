import { Module } from '@nestjs/common';
import { PaymentMethodService } from './services/payment-method.service';
import { PaymentMethodController } from './controllers/payment-method.controller';

@Module({
  controllers: [PaymentMethodController],
  providers: [PaymentMethodService],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule {}
