import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiHeader } from '@nestjs/swagger';
import {
  MasaratOpenSessionResponse,
  MasaratCompleteSessionResponse,
  MasaratOpenSessionDto,
  MasaratCompleteSessionDto,
} from '../dto/masarat.dto';

export function OpenSessionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Open session',
      description: 'Open a new session for the specified order',
    }),
    ApiParam({
      name: 'orderId',
      type: 'string',
      description: 'The UUID of the order',
    }),
    ApiBody({
      type: MasaratOpenSessionDto,
    }),
    ApiHeader({
      name: 'Authorization',
      required: true,
      example: 'Bearer token',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Session opened successfully',
      type: MasaratOpenSessionResponse,
    }),
  );
}

export function CompleteSessionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Complete session',
      description: 'Complete a session for the specified order',
    }),
    ApiParam({
      name: 'orderId',
      type: 'string',
      description: 'The UUID of the order',
    }),
    ApiBody({
      type: MasaratCompleteSessionDto,
    }),
    ApiHeader({
      name: 'Authorization',
      required: true,
      example: 'Bearer token',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Session completed successfully',
      type: MasaratCompleteSessionResponse,
    }),
  );
}
