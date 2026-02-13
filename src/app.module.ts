import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RegionModule } from './modules/region/region.module';
import { BakeryModule } from './modules/bakery/bakery.module';
import { ChefModule } from './modules/chef/chef.module';
import { FeaturedCakeModule } from './modules/featured-cake/featured-cake.module';
import { SweetModule } from './modules/sweet/sweet.module';
import { AddonModule } from './modules/addon/addon.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { SliderImageModule } from './modules/slider-image/slider-image.module';
import { TagsModule } from './modules/tags/tags.module';
import { AdminExtractionMiddleware } from '@/common/middleware/admin-extraction.middleware';
import { OrderModule } from './modules/order/order.module';
// import { WishlistModule } from './modules/wishlist/wishlist.module';
// import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    AuthModule,
    RegionModule,
    BakeryModule,
    ChefModule,
    FeaturedCakeModule,
    SweetModule,
    AddonModule,
    AdminAuthModule,
    UploadModule,
    OrderModule,
    // WishlistModule,
    // ReviewModule,
    SliderImageModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminExtractionMiddleware).forRoutes('*');
  }
}
