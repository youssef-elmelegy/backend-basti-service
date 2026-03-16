import { Module } from '@nestjs/common';
import { FeaturedCakeService } from './services/featured-cake.service';
import { FeaturedCakeController } from './controllers/featured-cake.controller';
import { BakeryModule } from '../bakery/bakery.module';

@Module({
  imports: [BakeryModule],
  controllers: [FeaturedCakeController],
  providers: [FeaturedCakeService],
  exports: [FeaturedCakeService],
})
export class FeaturedCakeModule {}
