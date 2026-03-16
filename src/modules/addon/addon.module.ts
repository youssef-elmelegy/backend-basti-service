import { Module } from '@nestjs/common';
import { AddonController } from './controllers/addon.controller';
import { AddonService } from './services/addon.service';
import { BakeryModule } from '../bakery/bakery.module';

@Module({
  imports: [BakeryModule],
  controllers: [AddonController],
  providers: [AddonService],
  exports: [AddonService],
})
export class AddonModule {}
