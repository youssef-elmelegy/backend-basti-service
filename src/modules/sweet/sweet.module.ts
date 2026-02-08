import { Module } from '@nestjs/common';
import { SweetService } from './services/sweet.service';
import { SweetController } from './controllers/sweet.controller';

@Module({
  controllers: [SweetController],
  providers: [SweetService],
  exports: [SweetService],
})
export class SweetModule {}
