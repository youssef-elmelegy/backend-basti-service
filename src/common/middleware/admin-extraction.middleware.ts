import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '@/common/decorators/current-user.decorator';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  admin?: {
    id: string;
    email: string;
    role: 'super_admin' | 'admin' | 'manager';
  };
}

@Injectable()
export class AdminExtractionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AdminExtractionMiddleware.name);

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    this.logger.debug(`[${req.method}] ${req.path} - Auth header present: ${!!authHeader}`);

    // If user is authenticated via JWT, extract admin info and set on request
    if (req.user) {
      this.logger.debug(`JWT user found: ${JSON.stringify(req.user)}`);

      if (req.user.email && req.user.role) {
        req.admin = {
          id: req.user.id || '',
          email: req.user.email,
          role: req.user.role,
        };
        this.logger.debug(`Admin extracted: ${req.admin.email} (${req.admin.role})`);
      } else {
        this.logger.warn(`JWT user missing email or role: ${JSON.stringify(req.user)}`);
      }
    } else {
      this.logger.debug(`No JWT user found on request`);
    }

    next();
  }
}
