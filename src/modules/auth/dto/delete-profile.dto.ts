import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteProfileDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'SecurePass123',
  })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  password: string;
}

export class DeleteProfileResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Account deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Deleted user email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Deleted at timestamp',
    example: '2025-01-11T10:05:00.000Z',
  })
  deletedAt: Date;
}
