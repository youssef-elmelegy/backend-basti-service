import { Provider } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { env } from '@/env';

// Generic token so callers/wiring stay provider-agnostic. The concrete client
// is an implementation detail and can be swapped without touching EmailService.
export const MAIL_CLIENT = 'MAIL_CLIENT';

export const mailClientProvider: Provider = {
  provide: MAIL_CLIENT,
  useFactory: (): BrevoClient =>
    new BrevoClient({
      apiKey: env.BREVO_API_KEY,
    }),
};
