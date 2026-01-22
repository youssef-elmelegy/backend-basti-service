import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RegionModule } from './modules/region/region.module';
import { BakeryModule } from './modules/bakery/bakery.module';
import { ChefModule } from './modules/chef/chef.module';
import { CakeModule } from './modules/cake/cake.module';
import { AddModule } from './modules/add/add.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminExtractionMiddleware } from '@/common/middleware/admin-extraction.middleware';

@Module({
  imports: [
    AuthModule,
    RegionModule,
    BakeryModule,
    ChefModule,
    CakeModule,
    AddModule,
    AdminAuthModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminExtractionMiddleware).forRoutes('*');
  }
}
