import { ApiProperty } from "@nestjs/swagger";

export class CouponResponse {
	
	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	id: string;

	@ApiProperty({ example: 'BASTY20' })
	code: string;

	@ApiProperty({ example: 'Basty 20% off' })
	name: string;

	@ApiProperty({ example: 'percentage' })
	discountType: string;

	@ApiProperty({ example: 20 })
	discountValue: number;

	@ApiProperty({ example: 50 })
	minOrderValue: number | null;

	@ApiProperty({ example: '2026-05-01' })
	startDate: Date | null;

	@ApiProperty({ example: '2026-05-20' })
	expiryDate: Date | null;

	@ApiProperty({ example: 10 })
	usageLimitGlobal: number;

	@ApiProperty({ example: 1 })
	usageLimitPerUser: number;

	@ApiProperty({ example: true })
	isGlobal: boolean;

	@ApiProperty({ example: true })
	isActive: boolean;

	@ApiProperty({ example: '2026-05-01' })
	createdAt: Date;

	@ApiProperty({ example: '2026-05-20' })
	updatedAt: Date;
}