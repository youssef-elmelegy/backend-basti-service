import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function FilterDecorator() {
  return applyDecorators(
    ApiQuery({
      name: 'region_id',
      required: false,
      type: String,
      description: 'filter by region id',
    }),
    ApiQuery({
      name: 'tag',
      required: false,
      type: String,
      description: 'filter by tag',
    }),
  );
}
