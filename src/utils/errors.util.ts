import { HttpException, HttpStatus, InternalServerErrorException, Logger } from '@nestjs/common';
import { errorResponse } from './response.handler';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'unknown error';
}

/**
 * @deprecated Use handleErrorsAndThrow instead
 */
export function handleErrors(error: unknown): string {
  if (error instanceof HttpException) {
    throw error;
  }
  const errMsg = getErrorMessage(error);
  return errMsg;
}

export function handleErrorsAndThrow(error: unknown, message?: string, logger?: Logger): never {
  if (error instanceof HttpException) {
    throw error;
  }
  const errMsg = getErrorMessage(error);

  if (logger) {
    logger.error(`Internal Error: ${errMsg}`, error instanceof Error ? error.stack : undefined);
  }

  throw new InternalServerErrorException(
    errorResponse(
      message || 'An unexpected error occurred',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'InternalServerError',
    ),
  );
}
