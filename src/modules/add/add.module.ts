import { Module } from '@nestjs/common';
import { AddController } from './controllers/add.controller';
import { AddService } from './services/add.service';

@Module({
  controllers: [AddController],
  providers: [AddService],
  exports: [AddService],
})
export class AddModule {}
