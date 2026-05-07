import { PartialType } from '@nestjs/swagger';
import { GenerateCouponDto } from './generate.dto';

export class UpdateCouponDto extends PartialType(GenerateCouponDto) {}
