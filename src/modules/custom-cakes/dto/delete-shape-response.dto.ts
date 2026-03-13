import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class DeleteShapeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Shape and related records deleted successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: null;

  @ApiProperty({ example: '2024-02-07T12:00:00Z' })
  timestamp: string;
}
