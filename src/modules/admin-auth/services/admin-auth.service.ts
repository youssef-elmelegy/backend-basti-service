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
  CreateAdminDto,
  BlockAdminDto,
  UpdateAdminDto,
} from '../dto';
import { EmailService } from '@/common/services';
import { successResponse } from '@/utils';

@Injectable()
export class AdminAuthService {
  private passwordSchema = z
    .string()
    .min(8, 'validation.password_min')
    .regex(/[a-z]/, 'validation.password_lowercase')
    .regex(/[A-Z]/, 'validation.password_uppercase')
    .regex(/\d/, 'validation.password_digit');

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
      throw new UnauthorizedException('routes.auth.invalid_credentials');
    }

    if (admin.isBlocked) {
      throw new UnauthorizedException('routes.admin.account_blocked');
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('routes.auth.invalid_credentials');
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
      'routes.admin.logged_in',
      HttpStatus.OK,
    );
  }

  async forgotPassword(forgotPasswordDto: AdminForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (!admin) {
      throw new NotFoundException('routes.admin.email_not_found');
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
      'routes.otp.sent',
      HttpStatus.OK,
    );
  }

  async verifyOtp(verifyOtpDto: AdminVerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (!admin) {
      throw new NotFoundException('routes.admin.email_not_found');
    }

    if (!admin.otpCode) {
      throw new BadRequestException('routes.otp.no_otp');
    }

    if (admin.otpExpiresAt && admin.otpExpiresAt < new Date()) {
      throw new BadRequestException('routes.otp.expired');
    }

    if (admin.otpCode !== otp) {
      throw new UnauthorizedException('routes.otp.invalid_or_expired');
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
      'routes.otp.verified',
      HttpStatus.OK,
    );
  }

  async resetPassword(resetToken: string, resetPasswordDto: AdminResetPasswordDto) {
    const password = resetPasswordDto.newPassword;

    if (!password) {
      throw new BadRequestException('routes.auth.password_required');
    }

    try {
      this.passwordSchema.parse(password);
    } catch (error) {
      const message =
        error instanceof z.ZodError ? error.issues[0].message : 'routes.auth.invalid_password';
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
      throw new UnauthorizedException('routes.auth.reset_token_invalid');
    }

    if (decoded.type !== 'reset') {
      throw new UnauthorizedException('routes.auth.invalid_token_type');
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

    return successResponse(null, 'routes.auth.password_reset', HttpStatus.OK);
  }

  async changePassword(adminId: string, changePasswordDto: AdminChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('routes.auth.passwords_not_match');
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('routes.admin.not_found');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('routes.auth.current_password_incorrect');
    }

    try {
      this.passwordSchema.parse(newPassword);
    } catch (error) {
      const message =
        error instanceof z.ZodError ? error.issues[0].message : 'routes.auth.invalid_password';
      throw new BadRequestException(message);
    }

    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      throw new BadRequestException('routes.auth.new_password_differs');
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

    await db
      .update(admins)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, adminId));

    return successResponse(null, 'routes.auth.password_changed', HttpStatus.OK);
  }

  logout() {
    return successResponse(null, 'routes.auth.logout', HttpStatus.OK);
  }

  async getAdminById(adminId: string) {
    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('routes.admin.not_found');
    }

    return admin;
  }

  async refreshTokens(adminId: string) {
    const admin = await this.getAdminById(adminId);

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
      'routes.auth.tokens_refreshed',
      HttpStatus.OK,
    );
  }

  verifyRefreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return {
        id: (decoded as Record<string, unknown>).id as string,
      };
    } catch {
      throw new UnauthorizedException('routes.auth.invalid_or_expired_refresh_token');
    }
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    const { email, password, role, bakeryId, profileImage } = createAdminDto;

    // Check if admin with email already exists
    const existingAdmin = await db.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (existingAdmin) {
      throw new BadRequestException('routes.admin.email_exists');
    }

    // Validate password
    this.passwordSchema.parse(password);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [newAdmin] = await db
      .insert(admins)
      .values({
        email,
        password: hashedPassword,
        role: role,
        bakeryId: bakeryId || null,
        profileImage: profileImage || null,
      })
      .returning();

    return successResponse(
      {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        profileImage: newAdmin.profileImage || null,
        bakeryId: newAdmin.bakeryId || undefined,
        createdAt: newAdmin.createdAt,
        updatedAt: newAdmin.updatedAt,
      },
      'routes.admin.created',
      HttpStatus.CREATED,
    );
  }

  async blockAdmin(adminId: string, blockAdminDto: BlockAdminDto) {
    const { isBlocked } = blockAdminDto;
    // Check if admin exists
    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('routes.admin.not_found');
    }

    const [updatedAdmin] = await db
      .update(admins)
      .set({
        isBlocked,
        blockedAt: isBlocked ? new Date() : null,
      })
      .where(eq(admins.id, adminId))
      .returning();

    return successResponse(
      {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        profileImage: updatedAdmin.profileImage || null,
        bakeryId: updatedAdmin.bakeryId || undefined,
        isBlocked: updatedAdmin.isBlocked,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt,
      },
      isBlocked ? 'routes.admin.blocked' : 'routes.admin.unblocked',
      HttpStatus.OK,
    );
  }

  async updateAdmin(adminId: string, updateAdminDto: UpdateAdminDto) {
    const { role, bakeryId, profileImage } = updateAdminDto;

    // Check if admin exists
    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!admin) {
      throw new NotFoundException('routes.admin.not_found');
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (bakeryId !== undefined) updateData.bakeryId = bakeryId;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const [updatedAdmin] = await db
      .update(admins)
      .set(updateData)
      .where(eq(admins.id, adminId))
      .returning();

    return successResponse(
      {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        profileImage: updatedAdmin.profileImage || null,
        bakeryId: updatedAdmin.bakeryId || undefined,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt,
      },
      'routes.admin.updated',
      HttpStatus.OK,
    );
  }

  async getAllAdmins() {
    const adminsList = await db.query.admins.findMany();

    const formattedAdmins = adminsList.map((admin) => ({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      profileImage: admin.profileImage || null,
      bakeryId: admin.bakeryId || undefined,
      isBlocked: admin.isBlocked,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }));

    return successResponse(
      {
        admins: formattedAdmins,
        total: formattedAdmins.length,
      },
      'routes.admin.list_retrieved',
      HttpStatus.OK,
    );
  }
}
