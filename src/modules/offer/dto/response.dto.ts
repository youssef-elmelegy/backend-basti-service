import { ApiProperty } from "@nestjs/swagger";

export class OfferResponse {
	
	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	id: string;

	@ApiProperty({ example: 'Eid al-Fitr sales!' })
	name: string;

	@ApiProperty({ example: 20 })
	percentage: number;

	@ApiProperty({ example: '2026-05-01' })
	startDate: Date | null;

	@ApiProperty({ example: '2026-05-20' })
	expiryDate: Date | null;

	@ApiProperty({ example: true })
	isActive: boolean;

	@ApiProperty({ example: '2026-05-01' })
	createdAt: Date;

	@ApiProperty({ example: '2026-05-20' })
	updatedAt: Date;
}