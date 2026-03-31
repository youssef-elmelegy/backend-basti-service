import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindAllQueryDto {
  @ApiProperty({
    description: 'Tag type (case-insensitive)',
    example: 'sweets',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;
}
