import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name (must be unique)',
    example: 'chocolate',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Display order of the tag',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(9999)
  displayOrder: number;
}
