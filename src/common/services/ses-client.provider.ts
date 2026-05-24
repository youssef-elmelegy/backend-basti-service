import { Provider } from '@nestjs/common';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { env } from '@/env';

export const SES_CLIENT = 'SES_CLIENT';

export const sesClientProvider: Provider = {
  provide: SES_CLIENT,
  useFactory: (): SESv2Client =>
    new SESv2Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    }),
};
