import { Module } from '@nestjs/common';
import { RegionService } from './services/region.service';
import { RegionController } from './controllers/region.controller';
import { FeaturedCakeModule } from '../featured-cake/featured-cake.module';
import { AddonModule } from '../addon/addon.module';
import { SweetModule } from '../sweet/sweet.module';
import { CustomCakesModule } from '../custom-cakes/custom-cakes.module';

@Module({
  imports: [FeaturedCakeModule, AddonModule, SweetModule, CustomCakesModule],
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
