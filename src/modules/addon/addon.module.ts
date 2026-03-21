import { Module } from '@nestjs/common';
import { AddonController } from './controllers/addon.controller';
import { AddonService } from './services/addon.service';
import { AddonOptionService } from './services/addon-option.service';
import { BakeryModule } from '../bakery/bakery.module';

@Module({
  imports: [BakeryModule],
  controllers: [AddonController],
  providers: [AddonService, AddonOptionService],
  exports: [AddonService, AddonOptionService],
})
export class AddonModule {}
