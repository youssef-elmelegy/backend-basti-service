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
import { CustomCakesModule } from './modules/custom-cakes/custom-cakes.module';
import { AdminExtractionMiddleware } from '@/common/middleware/admin-extraction.middleware';
import { OrderModule } from './modules/order/order.module';
import { CartModule } from './modules/cart/cart.module';
import { LocationModule } from './modules/location/location.module';
import { ConfigModule } from './modules/config/config.module';
import { PaymentMethodModule } from './modules/payment-method/payment-method.module';
import { ReviewModule } from './modules/review/review.module';
import { NotificationModule } from './modules/notification/notification.module';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import { TranslationModule } from '@/common/translation/translation.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { OfferModule } from './modules/offer/offer.module';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), '/src/i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver, // Checks the 'Accept-Language' header
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
    TranslationModule,
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
    CustomCakesModule,
    CartModule,
    LocationModule,
    ConfigModule,
    PaymentMethodModule,
    ReviewModule,
    SliderImageModule,
    TagsModule,
    NotificationModule,
    CouponModule,
    OfferModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminExtractionMiddleware).forRoutes('*');
  }
}
