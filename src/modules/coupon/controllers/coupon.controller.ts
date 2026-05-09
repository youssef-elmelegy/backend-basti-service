import { AdminRoles, AdminRolesGuard, CurrentUser, JwtAuthGuard, JwtWithAdminGuard } from '@/common';
import { Body, Controller, Param, Get, Post, Patch, Delete, UseGuards } from '@nestjs/common';
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
	@UseGuards(JwtAuthGuard)
	@VerifyCouponDecorator()
	async verifyCoupon(
		@Body() verifyDto: VerifyCouponDto,
		@CurrentUser('sub') userId: string,
	) {
		return this.couponService.verify(
			verifyDto,
			userId,
		);
	}

	@Post('generate')
	@UseGuards(JwtWithAdminGuard, AdminRolesGuard)
	@AdminRoles('super_admin', 'admin')
	@GenerateCouponDecorator()
	async generateCoupon(@Body() generateDto: GenerateCouponDto) {
		return this.couponService.generate(generateDto);
	}

	@Get()
	@UseGuards(JwtWithAdminGuard, AdminRolesGuard)
	@AdminRoles('super_admin', 'admin')
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
	@UseGuards(JwtWithAdminGuard, AdminRolesGuard)
	@AdminRoles('super_admin', 'admin')
	@UpdateCouponDecorator()
	async updateCoupon(
		@Param('id') id: string,
		@Body() updateDto: UpdateCouponDto,
	) {
		return this.couponService.update(id, updateDto);
	}

	@Patch(':id/toggle-status')
	@UseGuards(JwtWithAdminGuard, AdminRolesGuard)
	@AdminRoles('super_admin', 'admin')
	@ToggleCouponStatusDecorator()
	async toggleCouponStatus(@Param('id') id: string) {
		return this.couponService.toggleStatus(id);
	}

	@Delete(':id')
	@UseGuards(JwtWithAdminGuard, AdminRolesGuard)
	@AdminRoles('super_admin', 'admin')
	@DeleteCouponDecorator()
	async deleteCoupon(@Param('id') id: string) {
		return this.couponService.delete(id);
	}

	@Get('check/:code')
	@UseGuards(JwtWithAdminGuard, AdminRolesGuard)
	@AdminRoles('super_admin', 'admin')
	@CheckCodeExistsDecorator()
	async checkCodeExists(@Param('code') code: string) {
		return this.couponService.checkCodeExists(code);
	}
}
