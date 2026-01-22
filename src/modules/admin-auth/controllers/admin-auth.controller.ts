import { Controller, Post, Body, Patch, UseGuards, Req, Logger, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AdminAuthService } from '../services/admin-auth.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: unknown;
  };
}
import {
  AdminLoginDto,
  AdminForgotPasswordDto,
  AdminVerifyOtpDto,
  AdminResetPasswordDto,
  AdminChangePasswordDto,
} from '../dto';
import {
  AdminLoginEndpoint,
  AdminForgotPasswordEndpoint,
  AdminVerifyOtpEndpoint,
  AdminResetPasswordEndpoint,
  AdminChangePasswordEndpoint,
  AdminLogoutEndpoint,
} from '../decorators';
import { JwtAuthGuard, Public } from '@/common';

@ApiTags('admin-auth')
@Controller('admin-auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @AdminLoginEndpoint()
  async login(@Body() loginDto: AdminLoginDto, @Res() res: Response) {
    this.logger.debug(`Admin login attempt: ${loginDto.email}`);
    const result = await this.adminAuthService.login(loginDto);

    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    this.logger.log(`Admin logged in: ${result.data.admin.id}`);
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Public()
  @Post('forgot-password')
  @AdminForgotPasswordEndpoint()
  async forgotPassword(@Body() forgotPasswordDto: AdminForgotPasswordDto, @Res() res: Response) {
    this.logger.debug(`Forgot password request: ${forgotPasswordDto.email}`);
    const result = await this.adminAuthService.forgotPassword(forgotPasswordDto);
    this.logger.log(`OTP sent to: ${forgotPasswordDto.email}`);
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Public()
  @Post('verify-otp')
  @AdminVerifyOtpEndpoint()
  async verifyOtp(@Body() verifyOtpDto: AdminVerifyOtpDto, @Res() res: Response) {
    this.logger.debug(`OTP verification attempt: ${verifyOtpDto.email}`);
    const result = await this.adminAuthService.verifyOtp(verifyOtpDto);

    res.cookie('resetToken', result.data.resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // TODO: update this and the other to don't be hard coded
    });

    this.logger.log(`OTP verified for: ${verifyOtpDto.email}`);
    return res.json({
      success: result.success,
      message: result.message,
      data: {
        email: result.data.email,
      },
      timestamp: new Date().toISOString(),
    });
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @AdminResetPasswordEndpoint()
  async resetPassword(
    @Body() resetPasswordDto: AdminResetPasswordDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const adminId = req.user.id;
    this.logger.debug(`Reset password request for admin: ${adminId}`);

    const result = await this.adminAuthService.resetPassword(adminId, resetPasswordDto);

    res.clearCookie('resetToken');

    this.logger.log(`Password reset for admin: ${adminId}`);
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @AdminChangePasswordEndpoint()
  async changePassword(
    @Body() changePasswordDto: AdminChangePasswordDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const adminId = req.user.id;
    this.logger.debug(`Change password request for admin: ${adminId}`);

    const result = await this.adminAuthService.changePassword(adminId, changePasswordDto);

    this.logger.log(`Password changed for admin: ${adminId}`);
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @AdminLogoutEndpoint()
  logout(@Res() res: Response) {
    this.logger.log('Admin logout');

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('resetToken');

    const result = this.adminAuthService.logout();
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Public()
  @Post('check-auth')
  async checkAuth(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    this.logger.debug('Check auth request');
    try {
      if (req.user?.id) {
        const admin = await this.adminAuthService.getAdminById(req.user.id);
        return res.json({
          success: true,
          data: {
            isAuthenticated: true,
            admin: {
              id: admin.id,
              email: admin.email,
              role: admin.role,
              profileImage: admin.profileImage,
              bakeryId: admin.bakeryId || undefined,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        data: {
          isAuthenticated: false,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Auth check failed: ${error}`);
      return res.json({
        success: true,
        data: {
          isAuthenticated: false,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
