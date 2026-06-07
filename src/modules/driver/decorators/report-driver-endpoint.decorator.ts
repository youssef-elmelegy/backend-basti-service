import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateReportDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function ReportDriverDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Report a driver', description: 'Create a report against a driver' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Report created',
      type: CreateReportDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),
  );
}
