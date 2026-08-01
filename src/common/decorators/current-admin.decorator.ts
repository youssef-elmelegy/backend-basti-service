import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AdminContext {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'driver';
}

interface RequestWithAdmin extends Request {
  admin?: AdminContext;
}

/**
 * Reads the admin that JwtWithAdminGuard attaches to the request.
 *
 * Distinct from CurrentUser, which reads request.user (the raw JWT payload).
 * Only valid on routes guarded by JwtWithAdminGuard.
 */
export const CurrentAdmin = createParamDecorator(
  (data: keyof AdminContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithAdmin>();
    const admin = request.admin;

    return data ? admin?.[data] : admin;
  },
);
