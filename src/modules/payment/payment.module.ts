import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { MasaratService } from './services/masarat.service';
import { TadawulService } from './services/tadawul.service';

@Module({
  controllers: [PaymentController],
  providers: [MasaratService, TadawulService],
})
export class PaymentModule {}
