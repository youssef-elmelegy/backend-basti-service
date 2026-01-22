import { Module } from '@nestjs/common';
import { RegionService } from './services/region.service';
import { RegionController } from './controllers/region.controller';

@Module({
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
