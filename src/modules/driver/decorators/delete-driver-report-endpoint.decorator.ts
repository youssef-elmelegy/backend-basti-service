import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function DeleteDriverReportDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete a driver report', description: 'Delete a report by id' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Report deleted' }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ErrorResponseDto }),
  );
}
