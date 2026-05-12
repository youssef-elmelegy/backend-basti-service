import { applyDecorators, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CouponExamples } from '@/constants/examples';
import { GenerateCouponDto, UpdateCouponDto, VerifyCouponDto } from '../dto';

export function VerifyCouponDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Verify a coupon' }),
		ApiBody({
			type: VerifyCouponDto,
			description: 'Coupon code and optional region to verify',
			examples: {
				success: {
					summary: 'Valid verification request',
					value: CouponExamples.verify.request,
				},
			},
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Coupon verified successfully',
			content: {
				'application/json': {
					example: CouponExamples.verify.response.success,
				},
			},
		}),
	);
}

export function GenerateCouponDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Generate a new coupon' }),
		ApiBody({
			type: GenerateCouponDto,
			description: 'Data to create a new coupon',
			examples: {
				success: {
					summary: 'Valid generation request',
					value: CouponExamples.generate.request,
				},
			},
		}),
		ApiResponse({
			status: HttpStatus.CREATED,
			description: 'Coupon created successfully',
			content: {
				'application/json': {
					example: CouponExamples.generate.response.success,
				},
			},
		}),
	);
}

export function GetAllCouponsDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Get all coupons' }),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Coupons retrieved successfully',
			content: {
				'application/json': {
					example: CouponExamples.getAll.response.success,
				},
			},
		}),
	);
}

export function GetOneCouponDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Get a single coupon' }),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Coupon retrieved successfully',
			content: {
				'application/json': {
					example: CouponExamples.getById.response.success,
				},
			},
		}),
	);
}

export function UpdateCouponDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Update a coupon' }),
		ApiBody({
			type: UpdateCouponDto,
			description: 'Data to update the coupon',
			examples: {
				success: {
					summary: 'Valid update request',
					value: CouponExamples.update.request,
				},
			},
		}),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Coupon updated successfully',
			content: {
				'application/json': {
					example: CouponExamples.update.response.success,
				},
			},
		}),
	);
}

export function ToggleCouponStatusDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Toggle coupon active status' }),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Coupon status toggled successfully',
			content: {
				'application/json': {
					example: CouponExamples.toggleStatus.response.success,
				},
			},
		}),
	);
}

export function DeleteCouponDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Delete a coupon' }),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Coupon deleted successfully',
			content: {
				'application/json': {
					example: CouponExamples.delete.response.success,
				},
			},
		}),
	);
}

export function CheckCodeExistsDecorator() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({ summary: 'Check if a coupon code exists' }),
		ApiResponse({
			status: HttpStatus.OK,
			description: 'Returns boolean indicating if code exists',
		}),
	);
}
