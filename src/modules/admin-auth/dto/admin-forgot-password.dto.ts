import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminForgotPasswordDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;
}
