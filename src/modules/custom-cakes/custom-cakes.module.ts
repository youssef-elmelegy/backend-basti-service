import { Module } from '@nestjs/common';
import { FlavorService } from './services/flavor.service';
import { ShapeService } from './services/shape.service';
import { DecorationService } from './services/decoration.service';
import { PredesignedCakesService } from './services/predesigned-cakes.service';
import { FlavorController } from './controllers/flavor.controller';
import { ShapeController } from './controllers/shape.controller';
import { DecorationController } from './controllers/decoration.controller';
import { PredesignedCakesController } from './controllers/predesigned-cakes.controller';

@Module({
  controllers: [
    FlavorController,
    ShapeController,
    DecorationController,
    PredesignedCakesController,
  ],
  providers: [
    FlavorService,
    ShapeService,
    DecorationService,
    PredesignedCakesService,
    {
      provide: 'PREDESIGNED_CAKES_REGION_PRICING_SERVICE',
      useClass: PredesignedCakesService,
    },
  ],
  exports: [FlavorService, ShapeService, DecorationService, PredesignedCakesService],
})
export class CustomCakesModule {}
