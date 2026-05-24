import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AccessTokenStrategy, RefreshTokenStrategy, JwtAuthGuard } from '@/common';
import { MailModule } from '@/common/mail/mail.module';
import { env } from '@/env';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
