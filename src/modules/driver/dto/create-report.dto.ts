import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'Report body describing the issue',
    example: 'Driver was rude and late',
  })
  @IsString()
  @IsNotEmpty()
  reportBody!: string;
}
