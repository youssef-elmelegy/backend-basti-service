import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateConfigDto, SuccessConfigResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ConfigExamples } from '@/constants/examples';

export function GetConfigDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get app configuration',
      description:
        'Retrieve the current application configuration including opening hours, weekends, holidays, and emergency closures',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Config retrieved successfully',
      type: SuccessConfigResponseDto,
      example: ConfigExamples.get.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve config',
      type: ErrorResponseDto,
    }),
  );
}

export function UpdateConfigDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update app configuration',
      description:
        'Update the application configuration. All fields are optional — only provided fields will be updated.',
    }),
    ApiBody({
      type: UpdateConfigDto,
      description:
        'Optional: openingHour, closingHour, minHoursToPrepare, weekendDays, holidays, emergencyClosures, isOpen, closureMessage',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Config updated successfully',
      type: SuccessConfigResponseDto,
      example: ConfigExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update config',
      type: ErrorResponseDto,
    }),
  );
}
