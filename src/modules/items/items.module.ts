import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ConfigModule } from '../config/config.module';

@Module({
  controllers: [],
  providers: [ItemService],
  exports: [ItemService],
  imports: [ConfigModule],
})
export class ItemsModule {}
