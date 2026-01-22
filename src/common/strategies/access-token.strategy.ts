import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { env } from '@/env';
import { JwtPayload } from '@/common/decorators/current-user.decorator';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(AccessTokenStrategy.name);

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const cookies = req.cookies as Record<string, unknown>;
          if (cookies && cookies.accessToken) {
            this.logger.debug('JWT extracted from accessToken cookie');
            return cookies.accessToken as string;
          }
          return null;
        },
      ]),
      secretOrKey: env.JWT_ACCESS_SECRET,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    this.logger.debug(`JWT validation successful - Payload: ${JSON.stringify(payload)}`);
    return {
      sub: payload.sub || payload.id,
      id: payload.sub || payload.id,
      email: payload.email,
      role: payload.role,
    };
  }
}
