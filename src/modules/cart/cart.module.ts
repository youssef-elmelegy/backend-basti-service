import { Module } from '@nestjs/common';
import { CartController } from './controllers/cart.controller';
import { CartService } from './services/cart.service';
import { AddonModule } from '@/modules/addon/addon.module';
import { SweetModule } from '@/modules/sweet/sweet.module';
import { FeaturedCakeModule } from '@/modules/featured-cake/featured-cake.module';
import { CustomCakesModule } from '@/modules/custom-cakes/custom-cakes.module';
import { RegionModule } from '@/modules/region/region.module';

@Module({
  controllers: [CartController],
  providers: [CartService],
  imports: [AddonModule, SweetModule, FeaturedCakeModule, CustomCakesModule, RegionModule],
  exports: [CartService],
})
export class CartModule {}
