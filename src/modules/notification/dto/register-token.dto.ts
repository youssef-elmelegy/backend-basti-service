import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM device token to register for the authenticated user/admin',
    example: 'fGxYz1aBcDeFgHiJkLmNoPqRsTuVwXyZ:APA91bH...',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'FCM token is too short' })
  fcmToken: string;
}
