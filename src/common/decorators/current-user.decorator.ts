import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface JwtPayload {
  sub?: string;
  id?: string;
  email: string;
  role?: 'super_admin' | 'admin' | 'manager';
  iat?: number;
  exp?: number;
}

export const CurrentUser = createParamDecorator((data: keyof JwtPayload, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const user = request.user as JwtPayload;

  return data ? user?.[data] : user;
});
