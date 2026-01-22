import { Injectable, Logger } from '@nestjs/common';
import {
  verifyOtpTemplate,
  welcomeTemplate,
  passwordResetOtpTemplate,
} from '@/common/email-templates';
import { env } from '@/env';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    }) as unknown as Transporter;
  }

  /**
   * Generate a random OTP code
   * @param length Length of OTP code (default: 6)
   * @returns Random OTP code
   */
  generateOtp(length: number = 6): string {
    const otp = Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
    return otp;
  }

  /**
   * Send OTP verification email
   * @param to Email address to send to
   * @param otp OTP code to include in email
   * @param userName User's name for personalization
   */
  async sendOtpEmail(to: string, otp: string, userName: string): Promise<void> {
    try {
      const htmlContent = verifyOtpTemplate(otp, userName);

      await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: 'Verify Your Email - Basti',
        html: htmlContent,
      });

      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email after successful setup
   * @param to Email address to send to
   * @param firstName User's first name
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    try {
      const htmlContent = welcomeTemplate(firstName);

      await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: 'Welcome to Basti!',
        html: htmlContent,
      });

      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Calculate OTP expiration time
   * @param minutes Minutes until expiration (default: 10)
   * @returns Date object for expiration time
   */
  getOtpExpirationTime(minutes: number = 10): Date {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + minutes);
    return expirationTime;
  }

  /**
   * Send password reset OTP email
   * @param to Email address to send to
   * @param otp OTP code for password reset
   * @param userName User's name for personalization
   */
  async sendPasswordResetOtpEmail(to: string, otp: string, userName: string): Promise<void> {
    try {
      const htmlContent = passwordResetOtpTemplate(otp, userName);

      await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: 'Reset Your Password - Basti',
        html: htmlContent,
      });

      this.logger.log(`Password reset OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Check if OTP has expired
   * @param expirationTime OTP expiration time
   * @returns true if OTP has expired, false otherwise
   */
  isOtpExpired(expirationTime: Date | null): boolean {
    if (!expirationTime) return true;
    return new Date() > expirationTime;
  }

  /**
   * Check if reset token has expired
   * @param expirationTime Token expiration time
   * @returns true if token has expired, false otherwise
   */
  isResetTokenExpired(expirationTime: Date): boolean {
    return new Date() > expirationTime;
  }
}
