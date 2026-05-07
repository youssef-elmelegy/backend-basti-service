import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsUUID, IsNumber } from "class-validator";

export class VerifyCouponDto {
	@ApiProperty({ example: 'BASTY20' })
	@IsString()
	code: string;

	@ApiPropertyOptional({ example: '660e8400-e29b-41d4-a716-446655440001' })
	@IsOptional()
	@IsUUID('4')
	regionId?: string;

	@ApiPropertyOptional({ example: '660e8400-e29b-41d4-a716-446655440001' })
	@IsUUID('4')
	userId: string;

	@ApiProperty({ example: 125.00 })
	@IsOptional()
	@IsNumber()
	cartTotal?: number;

}
