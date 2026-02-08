import { Module } from '@nestjs/common';
import { ChefService } from './services/chef.service';
import { ChefController } from './controllers/chef.controller';

@Module({
  controllers: [ChefController],
  providers: [ChefService],
  exports: [ChefService],
})
export class ChefModule {}
