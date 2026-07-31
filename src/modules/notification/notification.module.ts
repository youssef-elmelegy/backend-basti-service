import { Module } from '@nestjs/common';
import { NotificationController } from './controllers/notification.controller';
import { PreferencesController } from './controllers/preferences.controller';
import { NotificationService } from './services/notification.service';
import { FirebaseService } from '@/common/services';

@Module({
  controllers: [NotificationController, PreferencesController],
  providers: [NotificationService, FirebaseService],
  exports: [NotificationService, FirebaseService],
})
export class NotificationModule {}
