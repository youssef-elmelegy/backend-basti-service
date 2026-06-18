import { Module } from '@nestjs/common';
import { EmailService } from '@/common/services/email.service';
import { mailClientProvider } from '@/common/services/mail-client.provider';

@Module({
  providers: [mailClientProvider, EmailService],
  exports: [EmailService],
})
export class MailModule {}
