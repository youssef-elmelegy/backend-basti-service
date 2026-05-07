import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/env';
import {
  SignupDto,
  LoginDto,
  AuthResponse,
  RefreshTokenResponse,
  VerifyOtpDto,
  SetupProfileDto,
  ResendOtpDto,
  GetProfileResponseDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
  DeleteProfileResponseDto,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { EmailService } from '@/common/services/email.service';
import { sign } from 'jsonwebtoken';

export interface SignupResponse {
  message: string;
  email: string;
}

export interface VerifyOtpResponse {
  message: string;
  tempToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
  };
}

export interface SetupProfileResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profileImage: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown
  private otpResendAttempts = new Map<string, { count: number; timestamp: number }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * User signup with OTP generation and email sending
   */
  async signup(signupDto: SignupDto): Promise<SuccessResponse<SignupResponse>> {
    const { email, password, firstName, lastName } = signupDto;

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      this.logger.warn(`Signup failed: Email already exists - ${email}`);
      throw new ConflictException(
        errorResponse(
          'routes.auth.email_exists',
          HttpStatus.CONFLICT,
          'ConflictException',
        ),
      );
    }

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
    const otp = this.emailService.generateOtp();
    const otpExpiresAt = this.emailService.getOtpExpirationTime();

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          isEmailVerified: false,
          otpCode: otp,
          otpExpiresAt,
        })
        .returning();

      this.logger.log(`User created with OTP: ${newUser.id} (${email})`);

      try {
        await this.emailService.sendOtpEmail(email, otp, firstName);
      } catch (emailError) {
        this.logger.error(`Failed to send OTP email to ${email}`, emailError);
      }

      return successResponse(
        {
          message: 'routes.auth.registered_otp_sent',
          email,
        },
        'routes.auth.registered_otp_sent',
        HttpStatus.CREATED,
      );
    } catch (error) {
      this.logger.error(`Signup error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.auth.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Verify OTP sent to user email
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<SuccessResponse<VerifyOtpResponse>> {
    const { email, otp } = verifyOtpDto;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      this.logger.warn(`OTP verification failed: User not found - ${email}`);
      throw new NotFoundException(
        errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (user.isEmailVerified) {
      this.logger.warn(`OTP verification failed: Email already verified - ${email}`);
      throw new ConflictException(
        errorResponse('routes.auth.email_already_verified', HttpStatus.CONFLICT, 'ConflictException'),
      );
    }

    const isOtpValid =
      user.otpCode === otp &&
      user.otpExpiresAt &&
      !this.emailService.isOtpExpired(user.otpExpiresAt);

    if (!isOtpValid) {
      this.logger.warn(`OTP verification failed: Invalid or expired OTP - ${email}`);
      throw new UnauthorizedException(
        errorResponse('routes.otp.invalid_or_expired', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
      );
    }

    try {
      await db
        .update(users)
        .set({
          isEmailVerified: true,
          otpCode: null,
          otpExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      this.logger.log(`Email verified for user: ${user.id} (${email})`);

      const tempToken = this.generateTemporaryToken(user.id, user.email);

      return successResponse(
        {
          message: 'routes.otp.verified',
          tempToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: true,
          },
        },
        'routes.otp.verified',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`OTP verification error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.auth.failed_verify_email',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Complete user profile setup after email verification
   */
  async setupProfile(
    userId: string,
    setupProfileDto: SetupProfileDto,
  ): Promise<SuccessResponse<SetupProfileResponse>> {
    const { phoneNumber, profileImage } = setupProfileDto;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      this.logger.warn(`Profile setup failed: User not found - ${userId}`);
      throw new NotFoundException(
        errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`Profile setup failed: Email not verified - ${userId}`);
      throw new ForbiddenException(
        errorResponse(
          'routes.auth.email_not_verified',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }

    try {
      await db
        .update(users)
        .set({
          phoneNumber,
          profileImage,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      this.logger.log(`Profile setup completed for user: ${userId}`);

      const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      const tokens = this.generateTokens(updatedUser.id, updatedUser.email);

      return successResponse(
        {
          ...tokens,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phoneNumber: updatedUser.phoneNumber || '',
            profileImage: updatedUser.profileImage || '',
            isEmailVerified: updatedUser.isEmailVerified,

            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
        'routes.profile.setup_complete',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Profile setup error for user ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.profile.failed_setup',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Resend OTP to user email
   */
  async resendOtp(resendOtpDto: ResendOtpDto): Promise<SuccessResponse<SignupResponse>> {
    const { email } = resendOtpDto;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      this.logger.warn(`OTP resend failed: User not found - ${email}`);
      throw new NotFoundException(
        errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (user.isEmailVerified) {
      this.logger.warn(`OTP resend failed: Email already verified - ${email}`);
      throw new ConflictException(
        errorResponse('routes.auth.email_already_verified', HttpStatus.CONFLICT, 'ConflictException'),
      );
    }

    const attemptData = this.otpResendAttempts.get(email);
    const now = Date.now();

    if (attemptData) {
      const timeSinceLastAttempt = (now - attemptData.timestamp) / 1000;

      if (timeSinceLastAttempt < this.OTP_RESEND_COOLDOWN_SECONDS) {
        this.logger.warn(`OTP resend failed: Too many attempts - ${email}`);
        throw new BadRequestException(
          errorResponse(
            'routes.auth.too_many_requests',
            HttpStatus.TOO_MANY_REQUESTS,
            'TooManyRequestsException',
          ),
        );
      }

      attemptData.count++;
      attemptData.timestamp = now;
    } else {
      this.otpResendAttempts.set(email, { count: 1, timestamp: now });
    }

    const otp = this.emailService.generateOtp();
    const otpExpiresAt = this.emailService.getOtpExpirationTime();

    try {
      await db
        .update(users)
        .set({
          otpCode: otp,
          otpExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      this.logger.log(`OTP resent for user: ${user.id} (${email})`);

      try {
        await this.emailService.sendOtpEmail(email, otp, user.firstName);
      } catch (emailError) {
        this.logger.error(`Failed to send OTP email to ${email}`, emailError);
      }

      return successResponse(
        {
          message: 'routes.otp.resent',
          email,
        },
        'routes.otp.resent',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`OTP resend error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.otp.failed_resend_otp',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * User login with email verification and profile setup checks
   */
  async login(loginDto: LoginDto): Promise<SuccessResponse<AuthResponse>> {
    const { email, password } = loginDto;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      this.logger.warn(`Login failed: User not found - ${email}`);
      throw new UnauthorizedException(
        errorResponse('routes.auth.invalid_credentials', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${email}`);
      throw new UnauthorizedException(
        errorResponse('routes.auth.invalid_credentials', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
      );
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`Login failed: Email not verified - ${email}`);
      throw new ForbiddenException(
        errorResponse(
          'routes.auth.email_not_verified',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }

    if (!user.phoneNumber) {
      this.logger.warn(`Login failed: Profile not set up - ${email}`);
      throw new ForbiddenException(
        errorResponse(
          'routes.profile.setup_incomplete',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }

    this.logger.log(`User login: ${user.id} (${email})`);

    const tokens = this.generateTokens(user.id, user.email);

    return successResponse(
      {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          profileImage: user.profileImage,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      'routes.auth.logged_in',
      HttpStatus.OK,
    );
  }

  /**
   * Refresh user tokens
   */
  async refreshTokens(userId: string): Promise<SuccessResponse<RefreshTokenResponse>> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      this.logger.warn(`Token refresh failed: User not found - ${userId}`);
      throw new UnauthorizedException(
        errorResponse(
          'routes.auth.invalid_or_expired_refresh_token',
          HttpStatus.UNAUTHORIZED,
          'UnauthorizedException',
        ),
      );
    }

    this.logger.debug(`Token refreshed: ${userId}`);

    const tokens = this.generateTokens(user.id, user.email);

    return successResponse(tokens, 'routes.auth.tokens_refreshed', HttpStatus.OK);
  }

  /**
   * User logout
   */
  logout(): SuccessResponse<{ message: string }> {
    this.logger.debug('User logout');
    // TODO: blacklist refresh token and clear cookies
    return successResponse({ message: 'routes.auth.logout' }, 'routes.auth.logout', HttpStatus.OK);
  }

  /**
   * Generate JWT tokens for user
   */
  private generateTokens(
    userId: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    this.logger.debug(`Generating tokens for: ${userId}`);
    const payload = {
      sub: userId,
      email,
    };

    const accessToken = sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate temporary token for profile setup (10 minutes expiry)
   */
  private generateTemporaryToken(userId: string, email: string): string {
    this.logger.debug(`Generating temporary token for: ${userId}`);
    const payload = {
      sub: userId,
      email,
      type: 'setup-profile',
    };

    return sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_SETUP_PROFILE_EXPIRES_IN,
    });
  }

  /**
   * Generate reset password token (1 hour expiry)
   */
  private generateResetToken(userId: string, email: string): string {
    this.logger.debug(`Generating reset token for: ${userId}`);
    const payload = {
      sub: userId,
      email,
      type: 'reset-password',
    };

    return sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_RESET_PASSWORD_EXPIRES_IN,
    });
  }

  /**
   * Change user password (authenticated endpoint)
   */
  async changePassword(
    userId: string,
    newPassword: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        this.logger.warn(`Password change failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      this.logger.log(`Password changed for user: ${userId}`);
      return successResponse(
        { message: 'routes.auth.password_changed' },
        'routes.auth.password_changed',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to change password for user: ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.auth.failed_change_password',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Forgot password - send reset OTP
   */
  async forgotPassword(
    email: string,
  ): Promise<SuccessResponse<{ message: string; email: string }>> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        this.logger.warn(`Forgot password request for non-existent email: ${email}`);
        return successResponse(
          { message: 'routes.otp.sent_if_exists', email },
          'routes.otp.sent_if_exists',
          HttpStatus.OK,
        );
      }

      const otp = this.emailService.generateOtp();
      const otpExpiresAt = this.emailService.getOtpExpirationTime();

      await db
        .update(users)
        .set({
          otpCode: otp,
          otpExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      try {
        await this.emailService.sendPasswordResetOtpEmail(user.email, otp, user.firstName);
      } catch (emailError) {
        this.logger.error(`Failed to send password reset OTP to ${email}`, emailError);
      }

      this.logger.log(`Password reset OTP sent to: ${email}`);
      return successResponse(
        { message: 'routes.otp.sent_if_exists', email },
        'routes.otp.sent_if_exists',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP to: ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.otp.failed_send_reset_otp',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Verify reset password OTP (email must be verified)
   */
  async verifyResetOtp(
    email: string,
    otp: string,
  ): Promise<SuccessResponse<{ message: string; resetToken: string }>> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        this.logger.warn(`Reset OTP verification failed: User not found - ${email}`);
        throw new NotFoundException(
          errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      if (!user.isEmailVerified) {
        this.logger.warn(`Reset OTP verification failed: Email not verified - ${email}`);
        throw new UnauthorizedException(
          errorResponse('routes.auth.email_not_verified', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
        );
      }

      const isOtpValid =
        user.otpCode === otp &&
        user.otpExpiresAt &&
        !this.emailService.isOtpExpired(user.otpExpiresAt);

      if (!isOtpValid) {
        this.logger.warn(`Reset OTP verification failed: Invalid or expired OTP - ${email}`);
        throw new UnauthorizedException(
          errorResponse('routes.otp.invalid_or_expired', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
        );
      }

      await db
        .update(users)
        .set({
          otpCode: null,
          otpExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const resetToken = this.generateResetToken(user.id, user.email);

      this.logger.log(`Reset OTP verified for user: ${user.id}`);
      return successResponse(
        { message: 'routes.otp.verified', resetToken },
        'routes.otp.verified',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to verify reset OTP for: ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.otp.failed_verify_reset_otp',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Reset password with reset token
   */
  async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    try {
      let payload: { sub: string; type: string };
      try {
        payload = this.jwtService.verify(resetToken, {
          secret: env.JWT_ACCESS_SECRET,
        });
      } catch {
        this.logger.warn('Reset password failed: Invalid or expired reset token');
        throw new UnauthorizedException(
          errorResponse(
            'routes.auth.reset_token_invalid',
            HttpStatus.UNAUTHORIZED,
            'UnauthorizedException',
          ),
        );
      }

      if (payload.type !== 'reset-password') {
        this.logger.warn('Reset password failed: Invalid token type');
        throw new UnauthorizedException(
          errorResponse('routes.auth.invalid_token_type', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
        );
      }

      const userId = payload.sub;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        this.logger.warn(`Reset password failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      this.logger.log(`Password reset for user: ${userId}`);
      return successResponse(
        { message: 'routes.auth.password_reset' },
        'routes.auth.password_reset',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to reset password`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.auth.failed_reset_password',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Get user profile information
   */
  async getProfile(userId: string): Promise<SuccessResponse<GetProfileResponseDto>> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        this.logger.warn(`Get profile failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      this.logger.log(`Profile retrieved for user: ${userId}`);
      const profileData: GetProfileResponseDto = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      return successResponse(profileData, 'routes.profile.retrieved', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Get profile error for ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.profile.failed_retrieve',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<SuccessResponse<UpdateProfileResponseDto>> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        this.logger.warn(`Update profile failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const updateData: Partial<{
        firstName: string;
        lastName: string;
        phoneNumber: string;
        profileImage: string;
        updatedAt: Date;
      }> = { updatedAt: new Date() };

      if (updateProfileDto.firstName) updateData.firstName = updateProfileDto.firstName;
      if (updateProfileDto.lastName) updateData.lastName = updateProfileDto.lastName;
      if (updateProfileDto.phoneNumber) updateData.phoneNumber = updateProfileDto.phoneNumber;
      if (updateProfileDto.profileImage) updateData.profileImage = updateProfileDto.profileImage;

      await db.update(users).set(updateData).where(eq(users.id, userId));

      this.logger.log(`Profile updated for user: ${userId}`);
      const responseData: UpdateProfileResponseDto = {
        message: 'routes.profile.updated',
        userId,
        updatedAt: updateData.updatedAt || new Date(),
      };
      return successResponse(responseData, 'routes.profile.updated', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Update profile error for ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.profile.failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Delete user account (requires password verification)
   */
  async deleteProfile(
    userId: string,
    password: string,
  ): Promise<SuccessResponse<DeleteProfileResponseDto>> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        this.logger.warn(`Delete profile failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('routes.auth.user_not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Delete profile failed: Invalid password - ${userId}`);
        throw new UnauthorizedException(
          errorResponse('routes.auth.invalid_password', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
        );
      }

      await db.delete(users).where(eq(users.id, userId));

      this.logger.log(`Account deleted for user: ${userId} (${user.email})`);
      const responseData: DeleteProfileResponseDto = {
        message: 'routes.auth.account_deleted',
        email: user.email,
        deletedAt: new Date(),
      };
      return successResponse(responseData, 'routes.auth.account_deleted', HttpStatus.OK);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Delete profile error for ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.auth.failed_delete_account',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
