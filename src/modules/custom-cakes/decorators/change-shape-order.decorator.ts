import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ChangeShapeOrderDto } from '../dto';
import { ShapeExamples } from '@/constants/examples';

export function ChangeShapeOrderDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change shape order',
      description:
        'Changes the order position of a shape. Automatically reorders other shapes to maintain sequential order numbering.',
    }),
    ApiParam({
      name: 'id',
      description: 'Shape ID (UUID)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: ChangeShapeOrderDto,
      description: 'New order position for the shape',
      examples: {
        success: {
          summary: 'Valid shape order change request',
          value: ShapeExamples.changeOrder.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Shape order successfully changed, returns all shapes sorted by order',
      example: ShapeExamples.changeOrder.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid order position',
      example: ShapeExamples.changeOrder.response.badRequest,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Shape not found',
      example: ShapeExamples.changeOrder.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to change shape order due to server error',
    }),
  );
}
