import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { env } from '@/env';
import { eq } from 'drizzle-orm';
import {
  AdminLoginDto,
  AdminForgotPasswordDto,
  AdminVerifyOtpDto,
  AdminResetPasswordDto,
  AdminChangePasswordDto,
} from '../dto';
import { EmailService } from '@/common/services';
import { successResponse } from '@/utils';

@Injectable()
export class AdminAuthService {
  private passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit');

  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: AdminLoginDto) {
    const { email, password } = loginDto;

    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.isBlocked) {
      throw new UnauthorizedException('Admin account is blocked');
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
    );

    const refreshToken = this.jwtService.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
    );

    return successResponse(
      {
        accessToken,
        refreshToken,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          profileImage: admin.profileImage,
          bakeryId: admin.bakeryId || undefined,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      },
      'Admin logged in successfully',
      HttpStatus.OK,
    );
  }

  async forgotPassword(forgotPasswordDto: AdminForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (!admin) {
      throw new NotFoundException('Admin with this email not found');
    }

    const otp = this.emailService.generateOtp(6);
    const otpExpiresAt = this.emailService.getOtpExpirationTime(10);

    await db
      .update(admins)
      .set({
        otpCode: otp,
        otpExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, admin.id));

    await this.emailService.sendPasswordResetOtpEmail(email, otp, email.split('@')[0]);

    return successResponse(
      {
        email,
      },
      'OTP sent to your email',
      HttpStatus.OK,
    );
  }

  async verifyOtp(verifyOtpDto: AdminVerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (!admin) {
      throw new NotFoundException('Admin with this email not found');
    }

    if (!admin.otpCode) {
      throw new BadRequestException('No OTP found. Please request a new one');
    }

    if (admin.otpExpiresAt && admin.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    if (admin.otpCode !== otp) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    const resetToken = this.jwtService.sign(
      {
        id: admin.id,
        email: admin.email,
        type: 'reset',
      },
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
    );

    return successResponse(
      {
        resetToken,
        email,
      },
      'OTP verified successfully',
      HttpStatus.OK,
    );
  }

  async resetPassword(resetToken: string, resetPasswordDto: AdminResetPasswordDto) {
    const password = resetPasswordDto.newPassword || resetPasswordDto.password;
    const confirmPassword = resetPasswordDto.confirmPassword;

    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      this.passwordSchema.parse(password);
    } catch (error) {
      const message = error instanceof z.ZodError ? error.issues[0].message : 'Invalid password';
      throw new BadRequestException(message);
    }

    interface ResetTokenPayload {
      id: string;
      email: string;
      role: 'super_admin' | 'admin' | 'manager';
      type: string;
    }

    let decoded: ResetTokenPayload;
    try {
      decoded = this.jwtService.verify(resetToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Reset token verification error:', message);
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (decoded.type !== 'reset') {
      throw new UnauthorizedException('Invalid token type');
    }

    const adminId = decoded.id;

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    await db
      .update(admins)
      .set({
        password: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, adminId));

    return successResponse(null, 'Password reset successfully', HttpStatus.OK);
  }

  async changePassword(adminId: string, changePasswordDto: AdminChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    try {
      this.passwordSchema.parse(newPassword);
    } catch (error) {
      const message = error instanceof z.ZodError ? error.issues[0].message : 'Invalid password';
      throw new BadRequestException(message);
    }

    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

    await db
      .update(admins)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, adminId));

    return successResponse(null, 'Password changed successfully', HttpStatus.OK);
  }

  logout() {
    return successResponse(null, 'Logout successful', HttpStatus.OK);
  }

  async getAdminById(adminId: string) {
    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }
}
