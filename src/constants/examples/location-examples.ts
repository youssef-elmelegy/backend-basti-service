import { MOCK_DATA } from '../global.constants';

const MOCK_IDS = {
  location: 'ff0e8400-e29b-41d4-a716-446655440020',
  location2: 'ff0e8400-e29b-41d4-a716-446655440021',
  user: MOCK_DATA.id.user,
};

const locationItem = {
  id: MOCK_IDS.location,
  label: 'Home',
  latitude: '30.04441961',
  longitude: '31.23571968',
  buildingNo: '12A',
  street: 'El-Maadi St',
  description: 'Apartment 5, 3rd floor, next to the pharmacy',
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

const locationItem2 = {
  id: MOCK_IDS.location2,
  label: 'Work',
  latitude: '30.06263000',
  longitude: '31.24967000',
  buildingNo: '88',
  street: 'Tahrir Square',
  description: 'Office building, 10th floor',
  createdAt: MOCK_DATA.dates.default,
  updatedAt: MOCK_DATA.dates.default,
};

export const LocationExamples = {
  create: {
    request: {
      label: 'Home',
      latitude: 30.04441961,
      longitude: 31.23571968,
      buildingNo: '12A',
      street: 'El-Maadi St',
      description: 'Apartment 5, 3rd floor, next to the pharmacy',
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Location created successfully',
        data: locationItem,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Locations retrieved successfully',
        data: [locationItem, locationItem2],
        timestamp: MOCK_DATA.dates.default,
      },
      empty: {
        code: 200,
        success: true,
        message: 'Locations retrieved successfully',
        data: [],
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  getById: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Location retrieved successfully',
        data: locationItem,
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  update: {
    request: {
      label: 'Home (Updated)',
      street: 'New El-Maadi St',
      description: 'Updated delivery instructions',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Location updated successfully',
        data: {
          ...locationItem,
          label: 'Home (Updated)',
          street: 'New El-Maadi St',
          description: 'Updated delivery instructions',
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Location deleted successfully',
        data: { message: 'Location deleted successfully' },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
} as const;
