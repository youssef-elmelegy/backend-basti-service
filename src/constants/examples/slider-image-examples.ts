import { MOCK_DATA } from '../global.constants';

const sliderImage1 = MOCK_DATA.image.sliderImages[0];
const sliderImage2 = MOCK_DATA.image.sliderImages[1];

export const SliderImageExamples = {
  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Slider images retrieved successfully',
        data: [
          {
            id: MOCK_DATA.id.sliderImage,
            imageUrl: sliderImage1,
            createdAt: MOCK_DATA.dates.default,
          },
          {
            id: 'cc0e8400-e29b-41d4-a716-446655440008',
            imageUrl: sliderImage2,
            createdAt: MOCK_DATA.dates.default,
          },
        ],
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  update: {
    request: [sliderImage1, sliderImage2],
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Slider images updated successfully',
        data: [
          {
            id: MOCK_DATA.id.sliderImage,
            imageUrl: sliderImage1,
            createdAt: MOCK_DATA.dates.default,
          },
          {
            id: 'cc0e8400-e29b-41d4-a716-446655440008',
            imageUrl: sliderImage2,
            createdAt: MOCK_DATA.dates.default,
          },
        ],
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
  delete: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Slider images deleted successfully',
        data: {
          message: 'Slider images deleted successfully',
        },
        timestamp: MOCK_DATA.dates.default,
      },
    },
  },
};
