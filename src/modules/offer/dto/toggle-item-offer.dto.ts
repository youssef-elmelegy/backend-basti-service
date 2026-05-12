import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class ToggleItemOfferDto {

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsUUID()
	@IsOptional()
	offerId?: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
	})
	@IsUUID()
	regionId!: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	addonId?: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	featuredCakeId?: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	sweetId?: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	predesignedCakeId?: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	decorationId?: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	flavorId?: string;

	@ApiProperty({ 
		example: '660e8400-e29b-41d4-a716-446655440001',
		required: false,
	})
	@IsOptional()
	@IsUUID()
	shapeId?: string;
}

