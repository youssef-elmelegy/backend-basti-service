import { Injectable, Logger, Inject } from '@nestjs/common';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import {
  verifyOtpTemplate,
  welcomeTemplate,
  passwordResetOtpTemplate,
} from '@/common/email-templates';
import { env } from '@/env';
import { SES_CLIENT } from './ses-client.provider';

type EmailKind = 'otp' | 'welcome' | 'password-reset';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly source = `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM}>`;

  constructor(@Inject(SES_CLIENT) private readonly ses: SESv2Client) {}

  generateOtp(length: number = 6): string {
    const otp = Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
    return otp;
  }

  async sendOtpEmail(to: string, otp: string, userName: string): Promise<void> {
    await this.send(to, 'Verify Your Email - Basti', verifyOtpTemplate(otp, userName), 'otp');
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.send(to, 'Welcome to Basti!', welcomeTemplate(firstName), 'welcome');
  }

  getOtpExpirationTime(minutes: number = 10): Date {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + minutes);
    return expirationTime;
  }

  async sendPasswordResetOtpEmail(to: string, otp: string, userName: string): Promise<void> {
    await this.send(
      to,
      'Reset Your Password - Basti',
      passwordResetOtpTemplate(otp, userName),
      'password-reset',
    );
  }

  isOtpExpired(expirationTime: Date | null): boolean {
    if (!expirationTime) return true;
    return new Date() > expirationTime;
  }

  isResetTokenExpired(expirationTime: Date): boolean {
    return new Date() > expirationTime;
  }

  private async send(to: string, subject: string, html: string, kind: EmailKind): Promise<void> {
    const command = new SendEmailCommand({
      FromEmailAddress: this.source,
      Destination: { ToAddresses: [to] },
      ...(env.MAIL_REPLY_TO ? { ReplyToAddresses: [env.MAIL_REPLY_TO] } : {}),
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    });

    try {
      await this.ses.send(command);
      if (kind === 'otp') this.logger.log(`OTP email sent to ${to}`);
      else if (kind === 'welcome') this.logger.log(`Welcome email sent to ${to}`);
      else this.logger.log(`Password reset OTP email sent to ${to}`);
    } catch (error) {
      const name = (error as { name?: string })?.name;
      const label = this.label(kind);
      if (name === 'MessageRejected') {
        this.logger.error(
          `SES rejected ${label} email to ${to} (likely sandbox/unverified recipient or invalid From):`,
          error,
        );
      } else if (name === 'ThrottlingException' || name === 'Throttling') {
        this.logger.error(`SES throttled ${label} email to ${to} - sending rate exceeded:`, error);
      } else if (name === 'MailFromDomainNotVerifiedException') {
        this.logger.error(
          `SES MAIL FROM domain not verified for ${env.MAIL_FROM} - verify domain in SES console:`,
          error,
        );
      } else {
        this.logger.error(`Failed to send ${label} email to ${to}:`, error);
      }
      throw error;
    }
  }

  private label(kind: EmailKind): string {
    if (kind === 'otp') return 'OTP';
    if (kind === 'welcome') return 'welcome';
    return 'password reset OTP';
  }
}
