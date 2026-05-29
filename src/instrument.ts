// IMPORTANT: this file must be imported as the VERY FIRST line of main.ts so
// Sentry can patch Node's internals before any other module loads.
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  // Disable entirely if no DSN is set (e.g., local dev without GlitchTip).
  enabled: !!process.env.SENTRY_DSN,
  // 10% of HTTP transactions captured for performance — adjust if your SDK plan / quota matters.
  tracesSampleRate: 0.1,
  // Don't leak request bodies to the issue tracker by default.
  sendDefaultPii: false,
});
