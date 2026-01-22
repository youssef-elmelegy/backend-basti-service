import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({
    description: 'User email address to resend OTP to',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;
}
