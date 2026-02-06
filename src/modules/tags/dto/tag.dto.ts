import { ApiProperty } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty({
    description: 'A unique tag name',
    example: 'chocolate',
  })
  name: string;
}
