import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateTagDto, SuccessTagResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { TagExamples } from '@/constants/examples/tag-examples';

export function UpdateTagDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Edit a tag',
      description: 'Edits an existing tag with unique name and display order.',
    }),
    ApiBody({
      type: UpdateTagDto,
      description: 'Tag edit data',
      examples: {
        fullUpdate: {
          summary: 'Full update (name + displayOrder)',
          value: TagExamples.update.request.fullUpdate,
        },
        partialName: {
          summary: 'Partial update (name only)',
          value: TagExamples.update.request.partialUpdateName,
        },
        partialDisplayOrder: {
          summary: 'Partial update (displayOrder only)',
          value: TagExamples.update.request.partialUpdateDisplayOrder,
        },
        noFields: {
          summary: 'No fields provided',
          value: TagExamples.update.request.noFields,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tag successfully updated',
      type: SuccessTagResponseDto,
      example: TagExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad request (validation or conflicts)',
      type: ErrorResponseDto,
      schema: {
        oneOf: [
          { example: TagExamples.update.response.badRequest.atLeastOneField },
          { example: TagExamples.update.response.badRequest.noChangesDetected },
          { example: TagExamples.update.response.nameConflict },
          { example: TagExamples.update.response.displayOrderConflict },
        ],
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Tag not found',
      type: ErrorResponseDto,
      schema: {
        example: TagExamples.delete.response.notFound,
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update tag due to server error',
      type: ErrorResponseDto,
      schema: {
        example: {
          message: 'Failed to update tag',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
