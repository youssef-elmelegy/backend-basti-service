import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/env';
import { SignupDto, LoginDto, AuthResponse, RefreshTokenResponse } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  async signup(signupDto: SignupDto): Promise<SuccessResponse<AuthResponse>> {
    const { email, password, name } = signupDto;

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

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
        })
        .returning();

      this.logger.log(`User created: ${newUser.id} (${email})`);

      const tokens = await this.generateTokens(newUser.id, newUser.email);

      return successResponse(
        {
          ...tokens,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
          },
        },
        'User registered successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Signup error for ${email}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create user',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

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

    this.logger.log(`User login: ${user.id} (${email})`);

    const tokens = await this.generateTokens(user.id, user.email);

    return successResponse(
      {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      'User logged in successfully',
      HttpStatus.OK,
    );
  }

  async refreshTokens(userId: string): Promise<SuccessResponse<RefreshTokenResponse>> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      this.logger.warn(`Token refresh failed: User not found - ${userId}`);
      throw new UnauthorizedException(
        errorResponse('User not found', HttpStatus.UNAUTHORIZED, 'UnauthorizedException'),
      );
    }

    this.logger.debug(`Token refreshed: ${userId}`);

    const tokens = await this.generateTokens(user.id, user.email);

    return successResponse(tokens, 'Tokens refreshed successfully', HttpStatus.OK);
  }

  logout(): SuccessResponse<{ message: string }> {
    this.logger.debug('User logout');
    // TODO: blacklist refresh token and clear cookies
    return successResponse({ message: 'Logout successful' }, 'Logout successful', HttpStatus.OK);
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.debug(`Generating tokens for: ${userId}`);
    const payload = {
      sub: userId,
      email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        secret: env.JWT_REFRESH_SECRET,
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
