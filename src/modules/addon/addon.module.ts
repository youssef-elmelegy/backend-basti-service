import { Module } from '@nestjs/common';
import { AddonController } from './controllers/addon.controller';
import { AddonService } from './services/addon.service';

@Module({
  controllers: [AddonController],
  providers: [AddonService],
  exports: [AddonService],
})
export class AddonModule {}
