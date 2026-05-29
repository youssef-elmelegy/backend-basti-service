import { ConsoleLogger, LogLevel } from '@nestjs/common';
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
 * enabled-level message to GlitchTip's Logs panel via Sentry SDK.
 *
 * Levels are gated by the user's NestJS LOG_LEVEL configuration — calls at
 * levels not enabled for stdout are also dropped from GlitchTip. This keeps
 * GlitchTip showing exactly what `docker logs basti-backend` shows.
 */
export class SentryLogger extends ConsoleLogger {
  private enabled(level: LogLevel): boolean {
    // ConsoleLogger.options.logLevels is set by setLogLevels(); fall back to
    // permissive defaults so we don't silently drop logs if it's unset.
    const allowed = this.options?.logLevels ?? ['error', 'warn', 'log'];
    return allowed.includes(level);
  }

  log(message: unknown, context?: string): void {
    super.log(message, context);
    if (this.enabled('log')) send('info', message, context ? { context } : {});
  }

  warn(message: unknown, context?: string): void {
    super.warn(message, context);
    if (this.enabled('warn')) send('warn', message, context ? { context } : {});
  }

  error(message: unknown, stack?: string, context?: string): void {
    super.error(message, stack, context as never);
    if (this.enabled('error')) {
      send('error', message, {
        ...(stack ? { stack } : {}),
        ...(context ? { context } : {}),
      });
    }
  }

  debug(message: unknown, context?: string): void {
    super.debug(message, context);
    if (this.enabled('debug')) send('debug', message, context ? { context } : {});
  }

  verbose(message: unknown, context?: string): void {
    super.verbose(message, context);
    if (this.enabled('verbose')) send('trace', message, context ? { context } : {});
  }

  fatal(message: unknown, context?: string): void {
    super.fatal(message, context);
    if (this.enabled('fatal')) send('fatal', message, context ? { context } : {});
  }
}
