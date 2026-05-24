import { Module } from '@nestjs/common';
import { EmailService } from '@/common/services/email.service';
import { sesClientProvider } from '@/common/services/ses-client.provider';

@Module({
  providers: [sesClientProvider, EmailService],
  exports: [EmailService],
})
export class MailModule {}
