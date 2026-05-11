import { IsString, IsEnum, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NOTIFICATION_TYPES, NotificationType } from './send-notification.dto';

export class BroadcastNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'New coupon: SUMMER20!',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'Use code SUMMER20 to get 20% off until 2026-06-01.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Body is required' })
  body: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NOTIFICATION_TYPES,
    example: 'promotion',
  })
  @IsEnum(NOTIFICATION_TYPES, {
    message: `Type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
  })
  type: NotificationType;

  @ApiProperty({
    description:
      'Optional ID the frontend uses to deep-link from the notification (e.g. a coupon ID for "promotion" type).',
    required: false,
    nullable: true,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'redirectId must not exceed 255 characters' })
  redirectId?: string;

  @ApiProperty({
    description: 'Optional metadata payload sent with the FCM message',
    example: { couponCode: 'SUMMER20' },
    required: false,
  })
  @IsOptional()
  data?: Record<string, string>;
}
