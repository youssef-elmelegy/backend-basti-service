import { Module } from '@nestjs/common';
import { FlavorService } from './services/flavor.service';
import { ShapeService } from './services/shape.service';
import { DecorationService } from './services/decoration.service';
import { FlavorController } from './controllers/flavor.controller';
import { ShapeController } from './controllers/shape.controller';
import { DecorationController } from './controllers/decoration.controller';

@Module({
  controllers: [FlavorController, ShapeController, DecorationController],
  providers: [FlavorService, ShapeService, DecorationService],
  exports: [FlavorService, ShapeService, DecorationService],
})
export class CustomCakesModule {}
