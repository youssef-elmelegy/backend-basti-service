import { MOCK_DATA } from '../global.constants';

export const TagsExamples = {
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Tags retrieved successfully',
        data: [
          'birthday',
          'chocolate',
          'fresh-fruit',
          'gluten-free',
          'strawberry',
          'vanilla',
          'vegan',
          'wedding',
        ],
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
};
