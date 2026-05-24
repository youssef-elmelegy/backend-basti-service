import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { Response } from 'express';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const i18n = I18nContext.current(host);

    const exceptionResponse = exception.getResponse() as {
      message?: string;
      args?: Record<string, unknown>;
      error?: string;
    };

    // Default to standard message
    let messageKey = exception.message;
    let args: Record<string, unknown> = {};

    // Check if the service threw an object with custom args
    if (typeof exceptionResponse === 'object') {
      messageKey = exceptionResponse.message || messageKey;
      args = exceptionResponse.args || {};
    }

    console.log(exceptionResponse);

    // Translate it, passing the args object
    const translatedMessage = i18n
      ? await i18n.t('messages.' + messageKey, { args: args, defaultValue: messageKey })
      : messageKey;

    response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      error: exceptionResponse.error || exception.name,
    });
  }
}
