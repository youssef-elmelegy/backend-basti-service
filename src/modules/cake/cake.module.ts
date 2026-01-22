import { Module } from '@nestjs/common';
import { CakeService } from './services/cake.service';
import { CakeController } from './controllers/cake.controller';

@Module({
  controllers: [CakeController],
  providers: [CakeService],
})
export class CakeModule {}
