import { Module } from '@nestjs/common';
import { SliderImageService } from './services/slider-image.service';
import { SliderImageController } from './controllers/slider-image.controller';

@Module({
  controllers: [SliderImageController],
  providers: [SliderImageService],
  exports: [SliderImageService],
})
export class SliderImageModule {}
