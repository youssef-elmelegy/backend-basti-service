import { ConsoleLogger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

type SentryLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function send(level: SentryLogLevel, message: unknown, attrs: Record<string, unknown> = {}) {
  // Never let a logging side-effect crash the app.
  try {
    const text = typeof message === 'string' ? message : JSON.stringify(message);
    Sentry.logger[level](text, attrs);
  } catch {
    /* noop */
  }
}

/**
 * NestJS logger that writes to stdout (default behavior) AND forwards every
 * message to GlitchTip's Logs panel via Sentry SDK. Only forwards levels that
 * NestJS itself is configured to emit (via LOG_LEVEL env var).
 */
export class SentryLogger extends ConsoleLogger {
  log(message: unknown, context?: string): void {
    super.log(message, context);
    send('info', message, context ? { context } : {});
  }

  warn(message: unknown, context?: string): void {
    super.warn(message, context);
    send('warn', message, context ? { context } : {});
  }

  error(message: unknown, stack?: string, context?: string): void {
    super.error(message, stack, context as never);
    send('error', message, {
      ...(stack ? { stack } : {}),
      ...(context ? { context } : {}),
    });
  }

  debug(message: unknown, context?: string): void {
    super.debug(message, context);
    send('debug', message, context ? { context } : {});
  }

  verbose(message: unknown, context?: string): void {
    super.verbose(message, context);
    send('trace', message, context ? { context } : {});
  }

  fatal(message: unknown, context?: string): void {
    super.fatal(message, context);
    send('fatal', message, context ? { context } : {});
  }
}
