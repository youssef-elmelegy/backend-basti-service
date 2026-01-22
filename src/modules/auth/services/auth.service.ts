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
          'User with this email already exists',
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
          message: 'User registered successfully. OTP sent to your email',
          email,
        },
        'User registered successfully. OTP sent to your email',
        HttpStatus.CREATED,
      );
    } catch (error) {
      this.logger.error(`Signup error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create user',
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
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (user.isEmailVerified) {
      this.logger.warn(`OTP verification failed: Email already verified - ${email}`);
      throw new ConflictException(
        errorResponse('Email already verified', HttpStatus.CONFLICT, 'ConflictException'),
      );
    }

    const isOtpValid =
      user.otpCode === otp &&
      user.otpExpiresAt &&
      !this.emailService.isOtpExpired(user.otpExpiresAt);

    if (!isOtpValid) {
      this.logger.warn(`OTP verification failed: Invalid or expired OTP - ${email}`);
      throw new UnauthorizedException(
        errorResponse('Invalid or expired OTP', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
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
          message: 'Email verified successfully',
          tempToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: true,
          },
        },
        'Email verified successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`OTP verification error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to verify email',
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
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`Profile setup failed: Email not verified - ${userId}`);
      throw new ForbiddenException(
        errorResponse(
          'Email not verified. Please verify your email first',
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
            phoneNumber: updatedUser.phoneNumber,
            profileImage: updatedUser.profileImage,
            isEmailVerified: updatedUser.isEmailVerified,

            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
        'Profile setup completed successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Profile setup error for user ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to complete profile setup',
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
        errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (user.isEmailVerified) {
      this.logger.warn(`OTP resend failed: Email already verified - ${email}`);
      throw new ConflictException(
        errorResponse('Email already verified', HttpStatus.CONFLICT, 'ConflictException'),
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
            'Too many OTP resend attempts. Please try again later',
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
          message: 'OTP resent successfully to your email',
          email,
        },
        'OTP resent successfully to your email',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`OTP resend error for ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to resend OTP',
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
        errorResponse('Invalid credentials', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${email}`);
      throw new UnauthorizedException(
        errorResponse('Invalid credentials', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
      );
    }

    if (!user.isEmailVerified) {
      this.logger.warn(`Login failed: Email not verified - ${email}`);
      throw new ForbiddenException(
        errorResponse(
          'Email not verified. Please verify your email before logging in',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }

    if (!user.phoneNumber) {
      this.logger.warn(`Login failed: Profile not set up - ${email}`);
      throw new ForbiddenException(
        errorResponse(
          'Profile setup incomplete. Please complete your profile setup',
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
      'User logged in successfully',
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
          'Invalid or expired refresh token',
          HttpStatus.UNAUTHORIZED,
          'UnauthorizedException',
        ),
      );
    }

    this.logger.debug(`Token refreshed: ${userId}`);

    const tokens = this.generateTokens(user.id, user.email);

    return successResponse(tokens, 'Tokens refreshed successfully', HttpStatus.OK);
  }

  /**
   * User logout
   */
  logout(): SuccessResponse<{ message: string }> {
    this.logger.debug('User logout');
    // TODO: blacklist refresh token and clear cookies
    return successResponse({ message: 'Logout successful' }, 'Logout successful', HttpStatus.OK);
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
          errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
        { message: 'Password changed successfully' },
        'Password changed successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to change password for user: ${userId}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to change password',
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
          { message: 'If the email exists, an OTP has been sent', email },
          'If the email exists, an OTP has been sent',
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
        { message: 'If the email exists, an OTP has been sent', email },
        'If the email exists, an OTP has been sent',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP to: ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to send reset OTP',
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
          errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      if (!user.isEmailVerified) {
        this.logger.warn(`Reset OTP verification failed: Email not verified - ${email}`);
        throw new UnauthorizedException(
          errorResponse('Email is not verified', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
        );
      }

      const isOtpValid =
        user.otpCode === otp &&
        user.otpExpiresAt &&
        !this.emailService.isOtpExpired(user.otpExpiresAt);

      if (!isOtpValid) {
        this.logger.warn(`Reset OTP verification failed: Invalid or expired OTP - ${email}`);
        throw new UnauthorizedException(
          errorResponse('Invalid or expired OTP', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
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
        { message: 'OTP verified successfully', resetToken },
        'OTP verified successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to verify reset OTP for: ${email}`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to verify reset OTP',
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
            'Invalid or expired reset token',
            HttpStatus.UNAUTHORIZED,
            'UnauthorizedException',
          ),
        );
      }

      if (payload.type !== 'reset-password') {
        this.logger.warn('Reset password failed: Invalid token type');
        throw new UnauthorizedException(
          errorResponse('Invalid token type', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
        );
      }

      const userId = payload.sub;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        this.logger.warn(`Reset password failed: User not found - ${userId}`);
        throw new NotFoundException(
          errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
        { message: 'Password reset successfully' },
        'Password reset successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to reset password`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to reset password',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
