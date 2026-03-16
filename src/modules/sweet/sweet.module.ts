import { Module } from '@nestjs/common';
import { SweetService } from './services/sweet.service';
import { SweetController } from './controllers/sweet.controller';
import { BakeryModule } from '../bakery/bakery.module';

@Module({
  imports: [BakeryModule],
  controllers: [SweetController],
  providers: [SweetService],
  exports: [SweetService],
})
export class SweetModule {}
