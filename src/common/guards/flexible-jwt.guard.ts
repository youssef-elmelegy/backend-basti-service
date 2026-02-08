import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class FlexibleJwtGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(FlexibleJwtGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const cookieToken = (request.cookies as Record<string, unknown>)?.accessToken as string;

    this.logger.debug(`[Flexible JWT Guard] ${request.method} ${request.path}`);
    this.logger.debug(`  @Public: ${isPublic ? 'Yes' : 'No'}`);
    this.logger.debug(
      `  Authorization header: ${authHeader ? `Present (${authHeader.substring(0, 30)}...)` : 'Missing'}`,
    );
    this.logger.debug(`  AccessToken cookie: ${cookieToken ? 'Present' : 'Missing'}`);

    if (isPublic) {
      this.logger.debug('  Skipping JWT validation (public route)');
      return true;
    }

    if (!authHeader && !cookieToken) {
      this.logger.error('  No token found in headers or cookies');
      throw new UnauthorizedException('No authentication token found');
    }

    this.logger.debug('  Validating JWT...');

    try {
      const result = super.canActivate(context);

      // Handle async result
      if (result instanceof Promise) {
        return result
          .then((res) => {
            if (res) {
              this.logger.debug('  JWT validation passed');
            } else {
              this.logger.error('  JWT validation failed (returned false)');
            }
            return res;
          })
          .catch((err: unknown) => {
            const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
            this.logger.error(`  JWT validation error: ${errorMessage}`);
            throw new UnauthorizedException(`JWT validation failed: ${errorMessage}`);
          });
      } else {
        this.logger.debug('  JWT validation passed (sync)');
        return result;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(`  Flexible JWT Guard error: ${errorMessage}`);
      throw new UnauthorizedException(`Authentication failed: ${errorMessage}`);
    }
  }
}
