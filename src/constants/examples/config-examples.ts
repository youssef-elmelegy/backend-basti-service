import { MOCK_DATA } from '../global.constants';

const MOCK_CONFIG_ID = 'aabb1122-e29b-41d4-a716-446655440030';

const configItem = {
  id: MOCK_CONFIG_ID,
  openingHour: 10,
  closingHour: 18,
  minHoursToPrepare: 24,
  weekendDays: [5, 6],
  holidays: ['2025-01-01', '2025-04-21'],
  emergencyClosures: [
    {
      from: '2025-03-01',
      to: '2025-03-03',
      reason: 'Scheduled maintenance',
    },
  ],
  isOpen: true,
  closureMessage: null,
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

export const ConfigExamples = {
  get: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Config retrieved successfully',
        data: configItem,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  update: {
    request: {
      openingHour: 9,
      closingHour: 20,
      weekendDays: [5, 6],
      holidays: ['2025-01-01', '2025-04-21', '2025-12-25'],
      emergencyClosures: [
        {
          from: '2025-03-01',
          to: '2025-03-03',
          reason: 'Scheduled maintenance',
        },
      ],
      isOpen: true,
      closureMessage: null,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Config updated successfully',
        data: {
          ...configItem,
          openingHour: 9,
          closingHour: 20,
          holidays: ['2025-01-01', '2025-04-21', '2025-12-25'],
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
