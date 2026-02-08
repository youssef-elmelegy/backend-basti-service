import { Module } from '@nestjs/common';
import { FeaturedCakeService } from './services/featured-cake.service';
import { FeaturedCakeController } from './controllers/featured-cake.controller';

@Module({
  controllers: [FeaturedCakeController],
  providers: [FeaturedCakeService],
})
export class FeaturedCakeModule {}
