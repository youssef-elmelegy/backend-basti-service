import type { NotificationType } from './send-notification.dto';

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  userId: string | null;
  adminId: string | null;
  redirectId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}
