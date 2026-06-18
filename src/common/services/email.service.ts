import { Injectable, Logger, Inject } from '@nestjs/common';
import { BrevoClient, BrevoError } from '@getbrevo/brevo';
import {
  verifyOtpTemplate,
  welcomeTemplate,
  passwordResetOtpTemplate,
} from '@/common/email-templates';
import { env } from '@/env';
import { MAIL_CLIENT } from './mail-client.provider';

type EmailKind = 'otp' | 'welcome' | 'password-reset';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sender = { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM };

  constructor(@Inject(MAIL_CLIENT) private readonly mail: BrevoClient) {}

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
    try {
      await this.mail.transactionalEmails.sendTransacEmail({
        sender: this.sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(env.MAIL_REPLY_TO ? { replyTo: { email: env.MAIL_REPLY_TO } } : {}),
      });
      if (kind === 'otp') this.logger.log(`OTP email sent to ${to}`);
      else if (kind === 'welcome') this.logger.log(`Welcome email sent to ${to}`);
      else this.logger.log(`Password reset OTP email sent to ${to}`);
    } catch (error) {
      const label = this.label(kind);
      if (error instanceof BrevoError) {
        this.logger.error(
          `Brevo rejected ${label} email to ${to} (status ${error.statusCode ?? 'unknown'}): ${JSON.stringify(error.body)}`,
          error.stack,
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
