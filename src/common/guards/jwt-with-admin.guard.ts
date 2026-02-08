import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

interface JwtPayload {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager';
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  admin?: {
    id: string;
    email: string;
    role: 'super_admin' | 'admin' | 'manager';
  };
}

@Injectable()
export class JwtWithAdminGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtWithAdminGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { authorization } = request.headers;

    this.logger.debug(`[JWT+Admin Guard] ${request.method} ${request.path}`);
    this.logger.debug(`  @Public: ${isPublic ? 'Yes' : 'No'}`);
    this.logger.debug(`  Authorization header: ${authorization ? 'Present' : 'Missing'}`);

    if (isPublic) {
      this.logger.debug('  → Skipping JWT validation (public route)');
      return true;
    }

    this.logger.debug('  → Validating JWT and extracting admin...');

    try {
      const canActivate = await super.canActivate(context);

      if (!canActivate) {
        this.logger.error('JWT validation failed');
        return false;
      }

      // After JWT validation, request.user should be set by Passport
      const user = request.user;
      this.logger.debug(`  JWT user: ${JSON.stringify(user)}`);

      if (!user) {
        this.logger.error('No user found after JWT validation');
        throw new UnauthorizedException('JWT validation successful but no user extracted');
      }

      // Extract admin from JWT payload
      if (user.email && user.role) {
        request.admin = {
          id: user.id || '',
          email: user.email,
          role: user.role,
        };
        this.logger.debug(`Admin extracted: ${request.admin.email} (${request.admin.role})`);
      } else {
        this.logger.error(`  ❌ JWT payload missing email or role: ${JSON.stringify(user)}`);
        throw new UnauthorizedException('JWT payload missing email or role');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`  ❌ JWT+Admin Guard error: ${errorMessage}`);
      throw new UnauthorizedException(`Authentication failed: ${errorMessage || 'Unknown error'}`);
    }
  }
}
