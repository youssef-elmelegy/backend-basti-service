import { Injectable, Logger, Inject } from '@nestjs/common';
import { BrevoClient, BrevoError } from '@getbrevo/brevo';
import { I18nContext } from 'nestjs-i18n';
import {
  renderVerifyOtpEmail,
  renderWelcomeEmail,
  renderPasswordResetOtpEmail,
  renderAdminPasswordResetOtpEmail,
  type EmailLanguage,
} from '@/common/email-templates';
import { env } from '@/env';
import { MAIL_CLIENT } from './mail-client.provider';

type EmailKind = 'otp' | 'welcome' | 'password-reset' | 'admin-password-reset';

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

  /**
   * Language for an outgoing email.
   *
   * Resolved from the active request (Accept-Language, ?lang=, or x-custom-lang
   * per the I18nModule resolvers). Falls back to English when there is no
   * request context — e.g. a cron or queue job — or when the resolved locale
   * is one we have no templates for. Callers may pass `lang` explicitly to
   * override, which is what non-request senders should do.
   */
  private resolveLanguage(lang?: string): EmailLanguage {
    const resolved = (lang ?? I18nContext.current()?.lang ?? 'en').split('-')[0].toLowerCase();
    return resolved === 'ar' ? 'ar' : 'en';
  }

  async sendOtpEmail(to: string, otp: string, userName: string, lang?: string): Promise<void> {
    const { subject, html } = renderVerifyOtpEmail(this.resolveLanguage(lang), otp, userName);
    await this.send(to, subject, html, 'otp');
  }

  async sendWelcomeEmail(to: string, firstName: string, lang?: string): Promise<void> {
    const { subject, html } = renderWelcomeEmail(this.resolveLanguage(lang), firstName);
    await this.send(to, subject, html, 'welcome');
  }

  getOtpExpirationTime(minutes: number = 10): Date {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + minutes);
    return expirationTime;
  }

  async sendPasswordResetOtpEmail(
    to: string,
    otp: string,
    userName: string,
    lang?: string,
  ): Promise<void> {
    const { subject, html } = renderPasswordResetOtpEmail(
      this.resolveLanguage(lang),
      otp,
      userName,
    );
    await this.send(to, subject, html, 'password-reset');
  }

  /**
   * Admin-facing variant of the password reset email. Wired to the admin
   * template rather than the customer one.
   */
  async sendAdminPasswordResetOtpEmail(
    to: string,
    otp: string,
    adminName?: string,
    lang?: string,
  ): Promise<void> {
    const { subject, html } = renderAdminPasswordResetOtpEmail(
      this.resolveLanguage(lang),
      otp,
      adminName,
    );
    await this.send(to, subject, html, 'admin-password-reset');
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
      this.logger.log(`${this.label(kind)} email sent to ${to}`);
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
    if (kind === 'admin-password-reset') return 'admin password reset OTP';
    return 'password reset OTP';
  }
}
