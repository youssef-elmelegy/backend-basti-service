import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ChangeFlavorOrderDto } from '../dto';
import { FlavorExamples } from '@/constants/examples';

export function ChangeFlavorOrderDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change flavor order',
      description:
        'Changes the order position of a flavor. Automatically reorders other flavors to maintain sequential order numbering.',
    }),
    ApiParam({
      name: 'id',
      description: 'Flavor ID (UUID)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: ChangeFlavorOrderDto,
      description: 'New order position for the flavor',
      examples: {
        success: {
          summary: 'Valid flavor order change request',
          value: FlavorExamples.changeOrder.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Flavor order successfully changed, returns all flavors sorted by order',
      example: FlavorExamples.changeOrder.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid order position',
      example: FlavorExamples.changeOrder.response.badRequest,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Flavor not found',
      example: FlavorExamples.changeOrder.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to change flavor order due to server error',
    }),
  );
}
