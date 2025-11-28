import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { SignupDto, LoginDto } from '../dto';
import { Public, CurrentUser, RefreshTokenGuard } from '@/common';
import {
  AuthSignupDecorator,
  AuthLoginDecorator,
  AuthRefreshTokenDecorator,
  AuthLogoutDecorator,
} from '../decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @AuthSignupDecorator()
  async signup(@Body() signupDto: SignupDto) {
    this.logger.debug(`Signup attempt: ${signupDto.email}`);
    const result = await this.authService.signup(signupDto);
    this.logger.log(`User registered: ${result.data.user.id}`);
    return result;
  }

  @Public()
  @Post('login')
  @AuthLoginDecorator()
  async login(@Body() loginDto: LoginDto) {
    this.logger.debug(`Login attempt: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    this.logger.log(`User logged in: ${result.data.user.id}`);
    return result;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @AuthRefreshTokenDecorator()
  async refreshTokens(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Token refresh: ${userId}`);
    return this.authService.refreshTokens(userId);
  }

  @Post('logout')
  @AuthLogoutDecorator()
  logout() {
    this.logger.debug('User logout');
    return this.authService.logout();
  }
}
