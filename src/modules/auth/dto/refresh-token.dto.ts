import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiamsiLCJpYXQiOjE3MzI2NzA0NzgsImV4cCI6MTczMjc1Njg3OH0.f9X9nU_WmSfQ',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
