import { HttpStatus } from '@nestjs/common';
import { SuccessResponse, ErrorResponse } from '@/types';

/**
 * Creates a standardized success response
 * @param data - Response data payload
 * @param message - Response message
 * @param code - HTTP status code (default: 200)
 * @returns Formatted success response
 */
export function successResponse<T>(
  data: T,
  message: string = 'Success',
  code: number = HttpStatus.OK,
): SuccessResponse<T> {
  return {
    code,
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response
 * @param message - Error message
 * @param code - HTTP status code (default: 500)
 * @param error - Optional error type/name
 * @param data - Optional additional error data like redirect info
 * @returns Formatted error response
 */
export function errorResponse(
  message: string,
  code: number = HttpStatus.INTERNAL_SERVER_ERROR,
  error?: string,
  data?: object,
): ErrorResponse {
  return {
    code,
    success: false,
    message,
    error,
    data,
    timestamp: new Date().toISOString(),
  };
}
