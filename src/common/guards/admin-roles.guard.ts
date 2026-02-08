import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'super_admin' | 'admin' | 'manager';
  };
  user?: Record<string, unknown>;
}

@Injectable()
export class AdminRolesGuard implements CanActivate {
  private readonly logger = new Logger(AdminRolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles) {
      this.logger.debug('No roles required for this route');
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const admin = request.admin;
    const user = request.user;

    this.logger.debug(`
      Checking roles for ${context.getClass().name}.${context.getHandler().name}
      Required: ${requiredRoles.join(', ')}
      Request admin: ${admin ? `${admin.email} (${admin.role})` : 'NOT SET'}
      Request user: ${user ? JSON.stringify(user) : 'NOT SET'}
    `);

    if (!admin) {
      this.logger.error('Admin not found on request. request.admin is null/undefined');
      throw new ForbiddenException('Admin not authenticated');
    }

    const hasRole = requiredRoles.includes(admin.role);

    if (!hasRole) {
      this.logger.error(
        `Admin role '${admin.role}' not in allowed roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `Admin role '${admin.role}' is not allowed to access this resource. Allowed: ${requiredRoles.join(', ')}`,
      );
    }

    this.logger.debug(`Admin ${admin.email} allowed with role ${admin.role}`);
    return true;
  }
}
