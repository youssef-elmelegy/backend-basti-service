import { IsString, IsEnum, IsUUID, MinLength, MaxLength, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const NOTIFICATION_TYPES = [
  'order_update',
  'order_status',
  'promotion',
  'system',
  'review',
  'new_order',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_RECIPIENT_TYPES = ['user', 'admin'] as const;
export type NotificationRecipientType = (typeof NOTIFICATION_RECIPIENT_TYPES)[number];

export class SendNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Your order is on the way!',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'Your cake order #123 is now out for delivery.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Body is required' })
  body: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NOTIFICATION_TYPES,
    example: 'order_status',
  })
  @IsEnum(NOTIFICATION_TYPES, {
    message: `Type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Recipient type — "user" or "admin"',
    enum: NOTIFICATION_RECIPIENT_TYPES,
    example: 'user',
  })
  @IsIn(NOTIFICATION_RECIPIENT_TYPES, {
    message: 'recipientType must be either "user" or "admin"',
  })
  recipientType: NotificationRecipientType;

  @ApiProperty({
    description: 'Recipient ID (UUID of the user or admin)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'recipientId must be a valid UUID' })
  recipientId: string;

  @ApiProperty({
    description:
      'Optional ID the frontend uses to deep-link from the notification (e.g. an order ID for "order_*" types). Free-form string so it can target different resources per type.',
    example: '770e8400-e29b-41d4-a716-446655440002',
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
    example: { orderId: '770e8400-e29b-41d4-a716-446655440002' },
    required: false,
  })
  @IsOptional()
  data?: Record<string, string>;
}
