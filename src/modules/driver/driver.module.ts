import { Module } from '@nestjs/common';
import { DriverController } from './controllers/driver.controller';
import { DriverService } from './services/driver.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AdminAuthModule, NotificationModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
