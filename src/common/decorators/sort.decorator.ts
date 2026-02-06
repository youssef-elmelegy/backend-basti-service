import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function SortDecorator() {
  return applyDecorators(
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      enum: ['created_at', 'alpha'],
      description: 'Sorting type: by date, alphabetically',
      example: 'created_at',
    }),
    ApiQuery({
      name: 'order',
      required: false,
      type: String,
      enum: ['asc', 'desc'],
      description: 'Sorting order',
      example: 'desc',
    }),
  );
}
