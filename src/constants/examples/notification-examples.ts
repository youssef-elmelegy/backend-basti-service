import { MOCK_DATA } from '../global.constants';

const NOTIFICATION_ID = 'dd0e8400-e29b-41d4-a716-446655440009';
const NOTIFICATION_ID_2 = 'dd0e8400-e29b-41d4-a716-446655440010';
const ORDER_ID = '770e8400-e29b-41d4-a716-446655440002';

export const NotificationExamples = {
  registerToken: {
    request: {
      fcmToken:
        'fGxYz1aBcDeFgHiJkLmNoPqRsTuVwXyZ:APA91bHexampleFCMtokenStringForDeviceRegistration',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'FCM token registered successfully',
        data: { message: 'FCM token registered successfully' },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  clearToken: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'FCM token cleared successfully',
        data: { message: 'FCM token cleared successfully' },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  send: {
    request: {
      title: 'Your order is on the way!',
      body: 'Your cake order #123 is now out for delivery.',
      type: 'order_status',
      recipientType: 'user',
      recipientId: MOCK_DATA.id.user,
      redirectId: ORDER_ID,
      data: { orderId: ORDER_ID },
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Notification sent successfully',
        data: {
          id: NOTIFICATION_ID,
          title: 'Your order is on the way!',
          body: 'Your cake order #123 is now out for delivery.',
          type: 'order_status',
          userId: MOCK_DATA.id.user,
          adminId: null,
          redirectId: ORDER_ID,
          isRead: false,
          readAt: null,
          createdAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          items: [
            {
              id: NOTIFICATION_ID,
              title: 'Your order is on the way!',
              body: 'Your cake order #123 is now out for delivery.',
              type: 'order_status',
              userId: MOCK_DATA.id.user,
              adminId: null,
              redirectId: ORDER_ID,
              isRead: false,
              readAt: null,
              createdAt: MOCK_DATA.dates.default,
            },
            {
              id: NOTIFICATION_ID_2,
              title: 'Special offer just for you',
              body: 'Get 20% off on your next order. Use code SWEET20.',
              type: 'promotion',
              userId: MOCK_DATA.id.user,
              adminId: null,
              redirectId: null,
              isRead: true,
              readAt: MOCK_DATA.dates.default,
              createdAt: MOCK_DATA.dates.default,
            },
          ],
          pagination: {
            total: 2,
            totalPages: 1,
            page: 1,
            limit: 10,
          },
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  unreadCount: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Unread count retrieved successfully',
        data: { unreadCount: 5 },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  markRead: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Notification marked as read',
        data: {
          id: NOTIFICATION_ID,
          title: 'Your order is on the way!',
          body: 'Your cake order #123 is now out for delivery.',
          type: 'order_status',
          userId: MOCK_DATA.id.user,
          adminId: null,
          redirectId: ORDER_ID,
          isRead: true,
          readAt: MOCK_DATA.dates.default,
          createdAt: MOCK_DATA.dates.default,
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  markAllRead: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'All notifications marked as read',
        data: { message: '5 notifications marked as read' },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Notification deleted successfully',
        data: { message: 'Notification deleted successfully' },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
