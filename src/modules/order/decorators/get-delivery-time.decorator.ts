import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GetDeliveryDateDto, GetDeliveryDateResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetDeliveryTimeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get delivery time information',
      description:
        'Calculate the nearest available delivery date and retrieve bakery configuration including working hours, holidays, and closures.',
    }),
    ApiBody({
      type: GetDeliveryDateDto,
      description:
        'Order type and optional item quantities to calculate delivery time. Type is required (big_cakes, small_cakes, others).',
      examples: {
        bigCakes: {
          summary: 'Big cakes order',
          value: {
            type: 'big_cakes',
            numberOfCustomCakes: 1,
          },
        },
        smallCakes: {
          summary: 'Small cakes order',
          value: {
            type: 'small_cakes',
            numberOfFeaturedCakes: 2,
            numberOfPredesignedCakes: 1,
          },
        },
        others: {
          summary: 'Other items order',
          value: {
            type: 'others',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Delivery time information retrieved successfully',
      type: GetDeliveryDateResponseDto,
      example: {
        code: 200,
        success: true,
        message: 'Retrieved delivery dates status successfully',
        data: {
          nearestDeliveryDate: '2025-12-25T10:00:00.000Z',
          details: '',
          configs: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            openingHour: 10,
            closingHour: 18,
            minHoursToPrepare: 24,
            weekendDays: [5, 6],
            holidays: ['2025-01-01', '2025-04-21'],
            emergencyClosures: [
              {
                from: '2025-12-31',
                to: '2026-01-02',
                reason: 'New Year Holiday',
              },
            ],
            isOpen: true,
            closureMessage: null,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
        timestamp: '2025-12-20T10:00:00.000Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve delivery time information',
      type: ErrorResponseDto,
    }),
  );
}
