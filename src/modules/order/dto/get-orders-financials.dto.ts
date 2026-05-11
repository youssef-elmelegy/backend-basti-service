import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";
import { PaginationDto } from '@/common/dto';

export class GetOrdersFinancialsDto extends PaginationDto {

	@ApiProperty({ description: 'Filter by bakery ID' })
	@IsOptional()
	@IsUUID()
	bakeryId?: string;

	@ApiProperty({ 
		description: 'filter order from a specific date',
		example: '2026-05-20'
	})
	@IsOptional()
	@IsDateString()
	from?: string;

	@ApiProperty({ 
		description: 'filter order to a specific date',
		example: '2026-06-20'
	 })
	@IsOptional()
	@IsDateString()
	to?: string;
}