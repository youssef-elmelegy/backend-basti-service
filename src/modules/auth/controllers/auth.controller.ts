import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthService,
  SignupResponse,
  VerifyOtpResponse,
  SetupProfileResponse,
} from '../services/auth.service';
import {
  SignupDto,
  LoginDto,
  VerifyOtpDto,
  VerifyResetOtpDto,
  SetupProfileDto,
  ResendOtpDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponse,
  RefreshTokenResponse,
} from '../dto';
import { Public, CurrentUser, RefreshTokenGuard, JwtAuthGuard } from '@/common';
import {
  AuthSignupDecorator,
  AuthLoginDecorator,
  AuthRefreshTokenDecorator,
  AuthLogoutDecorator,
  AuthVerifyOtpDecorator,
  AuthSetupProfileDecorator,
  AuthResendOtpDecorator,
  AuthChangePasswordDecorator,
  AuthForgotPasswordDecorator,
  AuthVerifyResetOtpDecorator,
  AuthResetPasswordDecorator,
} from '../decorators';
import { SuccessResponse } from '@/utils';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @AuthSignupDecorator()
  async signup(@Body() signupDto: SignupDto): Promise<SuccessResponse<SignupResponse>> {
    this.logger.debug(`Signup attempt: ${signupDto.email}`);
    const result = await this.authService.signup(signupDto);
    this.logger.log(`User registered: ${result.data.email}`);
    return result;
  }

  @Public()
  @Post('verify-otp')
  @AuthVerifyOtpDecorator()
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<SuccessResponse<VerifyOtpResponse>> {
    this.logger.debug(`OTP verification attempt: ${verifyOtpDto.email}`);
    const result = await this.authService.verifyOtp(verifyOtpDto);
    this.logger.log(`Email verified for user: ${result.data.user.id}`);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup-profile')
  @AuthSetupProfileDecorator()
  async setupProfile(
    @CurrentUser('sub') userId: string,
    @Body() setupProfileDto: SetupProfileDto,
  ): Promise<SuccessResponse<SetupProfileResponse>> {
    this.logger.debug(`Profile setup attempt: ${userId}`);
    const result = await this.authService.setupProfile(userId, setupProfileDto);
    this.logger.log(`Profile setup completed for user: ${userId}`);
    return result;
  }

  @Public()
  @Post('resend-otp')
  @AuthResendOtpDecorator()
  async resendOtp(@Body() resendOtpDto: ResendOtpDto): Promise<SuccessResponse<SignupResponse>> {
    this.logger.debug(`OTP resend attempt: ${resendOtpDto.email}`);
    const result = await this.authService.resendOtp(resendOtpDto);
    this.logger.log(`OTP resent to: ${result.data.email}`);
    return result;
  }

  @Public()
  @Post('login')
  @AuthLoginDecorator()
  async login(@Body() loginDto: LoginDto): Promise<SuccessResponse<AuthResponse>> {
    this.logger.debug(`Login attempt: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    this.logger.log(`User logged in: ${result.data.user.id}`);
    return result;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @AuthRefreshTokenDecorator()
  async refreshTokens(
    @CurrentUser('sub') userId: string,
  ): Promise<SuccessResponse<RefreshTokenResponse>> {
    this.logger.debug(`Token refresh: ${userId}`);
    return this.authService.refreshTokens(userId);
  }

  @Post('logout')
  @AuthLogoutDecorator()
  logout(): SuccessResponse<{ message: string }> {
    this.logger.debug('User logout');
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @AuthChangePasswordDecorator()
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<SuccessResponse<{ message: string }>> {
    this.logger.debug(`Change password attempt: ${userId}`);
    return this.authService.changePassword(userId, changePasswordDto.newPassword);
  }

  @Public()
  @Post('forgot-password')
  @AuthForgotPasswordDecorator()
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<SuccessResponse<{ message: string; email: string }>> {
    this.logger.debug(`Forgot password request: ${forgotPasswordDto.email}`);
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('verify-reset-otp')
  @AuthVerifyResetOtpDecorator()
  async verifyResetOtp(
    @Body() verifyResetOtpDto: VerifyResetOtpDto,
  ): Promise<SuccessResponse<{ message: string; resetToken: string }>> {
    this.logger.debug(`Reset OTP verification attempt: ${verifyResetOtpDto.email}`);
    return this.authService.verifyResetOtp(verifyResetOtpDto.email, verifyResetOtpDto.otp);
  }

  @Public()
  @Post('reset-password')
  @AuthResetPasswordDecorator()
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<SuccessResponse<{ message: string }>> {
    this.logger.debug('Reset password attempt');
    return this.authService.resetPassword(
      resetPasswordDto.resetToken,
      resetPasswordDto.newPassword,
    );
  }
}
