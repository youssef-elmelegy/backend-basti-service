import {
  Controller,
  Post,
  Body,
  Patch,
  Get,
  UseGuards,
  Req,
  Logger,
  Res,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
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
  CreateAdminDto,
  BlockAdminDto,
  UpdateAdminDto,
} from '../dto';
import {
  AdminLoginEndpoint,
  AdminForgotPasswordEndpoint,
  AdminVerifyOtpEndpoint,
  AdminResetPasswordEndpoint,
  AdminChangePasswordEndpoint,
  AdminLogoutEndpoint,
  AdminCheckAuthEndpoint,
  AdminRefreshTokenEndpoint,
  AdminCreateEndpoint,
  AdminBlockEndpoint,
  AdminUpdateEndpoint,
  AdminGetAllEndpoint,
} from '../decorators';
import { JwtAuthGuard, Public, AdminRoles, AdminRolesGuard, JwtWithAdminGuard } from '@/common';

@ApiTags('admin-auth')
@Controller('admin-auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @AdminLoginEndpoint()
  async login(@Body() loginDto: AdminLoginDto, @Req() req: Request, @Res() res: Response) {
    this.logger.debug(`Admin login attempt: ${loginDto.email}`);
    const result = await this.adminAuthService.login(loginDto);

    // Check if request is from mobile client
    const isMobileClient = req.headers['x-client-type'] === 'mobile';

    // Only set cookies if not from mobile
    if (!isMobileClient) {
      res.cookie('accessToken', result.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    this.logger.log(`Admin logged in: ${result.data.admin.id} (mobile: ${isMobileClient})`);

    // Return tokens in response if from mobile
    const responseData: {
      admin: typeof result.data.admin;
      accessToken?: string;
      refreshToken?: string;
    } = {
      admin: result.data.admin,
    };

    if (isMobileClient) {
      responseData.accessToken = result.data.accessToken;
      responseData.refreshToken = result.data.refreshToken;
    }

    return res.json({
      code: result.code,
      success: result.success,
      message: result.message,
      data: responseData,
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // TODO: update this and the other to don't be hard coded
      path: '/',
    });

    this.logger.log(`OTP verified for: ${verifyOtpDto.email}`);
    return res.json({
      success: result.success,
      message: result.message,
      data: {
        email: result.data.email,
        resetToken: result.data.resetToken,
      },
      timestamp: new Date().toISOString(),
    });
  }

  @Public()
  @Post('reset-password')
  @AdminResetPasswordEndpoint()
  async resetPassword(
    @Body() resetPasswordDto: AdminResetPasswordDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.debug('Reset password request');

    // Prefer token from body, fallback to cookie
    const resetTokenFromBody = resetPasswordDto.resetToken;
    const resetTokenFromCookie = (req.cookies as Record<string, unknown>)?.resetToken as
      | string
      | undefined;
    const resetToken = resetTokenFromBody || resetTokenFromCookie || '';

    const result = await this.adminAuthService.resetPassword(resetToken, resetPasswordDto);

    // Clear cookie if present
    res.clearCookie('resetToken');

    this.logger.log('Password reset completed');
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

  @Post('refresh')
  @Public()
  @AdminRefreshTokenEndpoint()
  async refreshTokens(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      // Check if request is from mobile client
      const isMobileClient = req.headers['x-client-type'] === 'mobile';

      // Get refresh token from either header (mobile) or cookies (web)
      let refreshToken = (req.cookies as Record<string, unknown>)?.refreshToken as string;

      if (isMobileClient && !refreshToken) {
        refreshToken = req.headers.authorization?.replace('Bearer ', '');
      }

      if (!refreshToken) {
        this.logger.warn('Refresh token not found');
        res.status(401).json({
          code: 401,
          success: false,
          message: 'Refresh token not found',
          error: 'Unauthorized',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      try {
        const decoded = this.adminAuthService.verifyRefreshToken(refreshToken) as { id: string };
        this.logger.debug(`Token refresh for admin: ${decoded.id} (mobile: ${isMobileClient})`);
        const result = await this.adminAuthService.refreshTokens(decoded.id);

        const accessToken = result.data.accessToken;
        const newRefreshToken = result.data.refreshToken;
        const adminData = result.data.admin;

        // Only set cookies if not from mobile
        if (!isMobileClient) {
          res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
          });

          res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
          });
        }

        this.logger.log(`Tokens refreshed for admin: ${decoded.id}`);

        const responseData: {
          admin: typeof adminData;
          accessToken?: string;
          refreshToken?: string;
        } = {
          admin: adminData,
        };

        // Include tokens in response if from mobile
        if (isMobileClient) {
          responseData.accessToken = accessToken;
          responseData.refreshToken = newRefreshToken;
        }

        res.json({
          code: 200,
          success: true,
          message: 'Tokens refreshed successfully',
          data: responseData,
          timestamp: new Date().toISOString(),
        });
      } catch (jwtError) {
        this.logger.warn(`Invalid refresh token: ${jwtError}`);
        res.clearCookie('refreshToken');
        res.status(401).json({
          code: 401,
          success: false,
          message: 'Invalid or expired refresh token',
          error: 'Unauthorized',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error}`);
      throw error;
    }
  }

  @Get('check-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @AdminCheckAuthEndpoint()
  async checkAuth(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    this.logger.debug('Check auth request');
    try {
      if (req.user?.id) {
        const admin = await this.adminAuthService.getAdminById(req.user.id);
        return res.json({
          code: 200,
          success: true,
          message: 'Authentication check completed',
          data: {
            isAuthenticated: true,
            admin: {
              id: admin.id,
              email: admin.email,
              role: admin.role,
              profileImage: admin.profileImage,
              bakeryId: admin.bakeryId || undefined,
              createdAt: admin.createdAt,
              updatedAt: admin.updatedAt,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        code: 200,
        success: true,
        message: 'Authentication check completed',
        data: {
          isAuthenticated: false,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Auth check failed: ${error}`);
      return res.json({
        code: 200,
        success: true,
        message: 'Authentication check completed',
        data: {
          isAuthenticated: false,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Post('create')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminCreateEndpoint()
  async create(@Body() createAdminDto: CreateAdminDto, @Res() res: Response) {
    const { email } = createAdminDto as { email: string };
    this.logger.debug(`Creating new admin: ${email}`);
    const result = await this.adminAuthService.createAdmin(createAdminDto);
    const { data } = result as { data: { id: string } };
    this.logger.log(`Admin created: ${data.id}`);
    return res.status(201).json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Patch(':id/block')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminBlockEndpoint()
  async blockAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() blockAdminDto: BlockAdminDto,
    @Res() res: Response,
  ) {
    this.logger.debug(`Updating block status for admin: ${id}`);
    const { isBlocked } = blockAdminDto as { isBlocked: boolean };
    const result = await this.adminAuthService.blockAdmin(id, blockAdminDto);
    this.logger.log(`Admin block status updated: ${id} - blocked: ${isBlocked}`);
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Patch(':id/update')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminUpdateEndpoint()
  async updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @Res() res: Response,
  ) {
    this.logger.debug(`Updating admin: ${id}`);
    const result = await this.adminAuthService.updateAdmin(id, updateAdminDto);
    this.logger.log(`Admin updated: ${id}`);
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  @Get()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminGetAllEndpoint()
  async getAllAdmins(@Res() res: Response) {
    this.logger.debug('Fetching all admins');
    const result = await this.adminAuthService.getAllAdmins();
    const { data } = result as { data: { admins: unknown[]; total: number } };
    this.logger.log(`Fetched admins: ${data.total}`);
    return res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }
}
