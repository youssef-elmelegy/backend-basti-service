import { Module } from '@nestjs/common';
import { CouponService } from './services/coupon.service';
import { CouponController } from './controllers/coupon.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [CouponService],
  controllers: [CouponController],
  exports: [CouponService],
})
export class CouponModule {}
