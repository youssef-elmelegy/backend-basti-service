import { Module } from '@nestjs/common';
import { DriverController } from './controllers/driver.controller';
import { DriverService } from './services/driver.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
