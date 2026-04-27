import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';
import { NOTIFICATION_TYPES } from './send-notification.dto';

export class NotificationDataDto {
  @ApiProperty({ example: 'dd0e8400-e29b-41d4-a716-446655440009' })
  id: string;

  @ApiProperty({ example: 'Your order is on the way!' })
  title: string;

  @ApiProperty({ example: 'Your cake order #123 is now out for delivery.' })
  body: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES, example: 'order_status' })
  type: string;

  @ApiProperty({ example: MOCK_DATA.id.user, nullable: true })
  userId: string | null;

  @ApiProperty({ example: null, nullable: true })
  adminId: string | null;

  @ApiProperty({
    example: '770e8400-e29b-41d4-a716-446655440002',
    nullable: true,
    description:
      'Optional deep-link ID the frontend uses to navigate from this notification (interpretation depends on type — e.g. order ID for "order_*" types).',
  })
  redirectId: string | null;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: null, nullable: true })
  readAt: Date | null;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  createdAt: Date;
}

export class NotificationPaginationDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class PaginatedNotificationsDto {
  @ApiProperty({ type: [NotificationDataDto] })
  items: NotificationDataDto[];

  @ApiProperty({ type: NotificationPaginationDto })
  pagination: NotificationPaginationDto;
}

export class SuccessNotificationResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notification retrieved successfully' })
  message: string;

  @ApiProperty({ type: NotificationDataDto })
  data: NotificationDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class SuccessNotificationsResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notifications retrieved successfully' })
  message: string;

  @ApiProperty({ type: PaginatedNotificationsDto })
  data: PaginatedNotificationsDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class UnreadCountDataDto {
  @ApiProperty({ example: 5 })
  unreadCount: number;
}

export class SuccessUnreadCountResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Unread count retrieved successfully' })
  message: string;

  @ApiProperty({ type: UnreadCountDataDto })
  data: UnreadCountDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class MessageDataDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}

export class SuccessMessageResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ type: MessageDataDto })
  data: MessageDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
