import { CurrentUser } from '@/common';
import { Body, Controller, Param, Get, Post, Patch, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponService } from '../services/coupon.service';
import { GenerateCouponDto, UpdateCouponDto, VerifyCouponDto } from '../dto';
import {
VerifyCouponDecorator,
GenerateCouponDecorator,
GetAllCouponsDecorator,
GetOneCouponDecorator,
UpdateCouponDecorator,
ToggleCouponStatusDecorator,
DeleteCouponDecorator,
CheckCodeExistsDecorator
} from '../decorators';

@Controller('coupon')
@ApiTags('coupon')
export class CouponController {
constructor(private readonly couponService: CouponService) {}

@Post('verify')
@VerifyCouponDecorator()
async verifyCoupon(
@Body() verifyDto: VerifyCouponDto,
@CurrentUser() user: any
) {
return this.couponService.verify(verifyDto);
}

@Post('generate')
@GenerateCouponDecorator()
async generateCoupon(@Body() generateDto: GenerateCouponDto) {
return this.couponService.generate(generateDto);
}

@Get()
@GetAllCouponsDecorator()
async getAllCoupons() {
return this.couponService.getAll();
}

@Get(':id')
@GetOneCouponDecorator()
async getOneCoupon(@Param('id') id: string) {
return this.couponService.getOne(id);
}

@Patch(':id')
@UpdateCouponDecorator()
async updateCoupon(
@Param('id') id: string,
@Body() updateDto: UpdateCouponDto
) {
return this.couponService.update(id, updateDto);
}

@Patch(':id/toggle-status')
@ToggleCouponStatusDecorator()
async toggleCouponStatus(@Param('id') id: string) {
return this.couponService.toggleStatus(id);
}

@Delete(':id')
@DeleteCouponDecorator()
async deleteCoupon(@Param('id') id: string) {
return this.couponService.delete(id);
}

@Get('check/:code')
@CheckCodeExistsDecorator()
async checkCodeExists(@Param('code') code: string) {
return this.couponService.checkCodeExists(code);
}
}
