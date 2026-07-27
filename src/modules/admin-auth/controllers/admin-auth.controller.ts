import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Get,
  UseGuards,
  Req,
  Logger,
  Res,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
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
  GetAdminsQueryDto,
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
  AdminDeleteEndpoint,
} from '../decorators';
import { JwtAuthGuard, Public, AdminRoles, AdminRolesGuard, JwtWithAdminGuard } from '@/common';
import { PaginationDecorator } from '@/common/decorators';

@ApiTags('admin-auth')
@Controller('admin-auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @AdminLoginEndpoint()
  async login(
    @Body() loginDto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.debug(`Admin login attempt: ${loginDto.email}`);

    // Check if request is from mobile client
    const isMobileClient = req.headers['x-client-type'] === 'mobile';

    const result = await this.adminAuthService.login(loginDto, isMobileClient);

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

    return {
      code: result.code,
      success: result.success,
      message: result.message,
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('forgot-password')
  @AdminForgotPasswordEndpoint()
  async forgotPassword(@Body() forgotPasswordDto: AdminForgotPasswordDto) {
    this.logger.debug(`Forgot password request: ${forgotPasswordDto.email}`);
    const result = await this.adminAuthService.forgotPassword(forgotPasswordDto);
    this.logger.log(`OTP sent to: ${forgotPasswordDto.email}`);
    return result;
  }

  @Public()
  @Post('verify-otp')
  @AdminVerifyOtpEndpoint()
  async verifyOtp(
    @Body() verifyOtpDto: AdminVerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
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
    return {
      success: result.success,
      message: result.message,
      data: {
        email: result.data.email,
        resetToken: result.data.resetToken,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('reset-password')
  @AdminResetPasswordEndpoint()
  async resetPassword(
    @Body() resetPasswordDto: AdminResetPasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
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
    return result;
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @AdminChangePasswordEndpoint()
  async changePassword(
    @Body() changePasswordDto: AdminChangePasswordDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user.id;
    this.logger.debug(`Change password request for admin: ${adminId}`);

    const result = await this.adminAuthService.changePassword(adminId, changePasswordDto);

    this.logger.log(`Password changed for admin: ${adminId}`);
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @AdminLogoutEndpoint()
  logout(@Res({ passthrough: true }) res: Response) {
    this.logger.log('Admin logout');

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('resetToken');

    return this.adminAuthService.logout();
  }

  @Post('refresh')
  @Public()
  @AdminRefreshTokenEndpoint()
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Check if request is from mobile client
    const isMobileClient = req.headers['x-client-type'] === 'mobile';

    // Get refresh token from either header (mobile) or cookies (web)
    let refreshToken = (req.cookies as Record<string, unknown>)?.refreshToken as string;

    if (isMobileClient && !refreshToken) {
      refreshToken = req.headers.authorization?.replace('Bearer ', '');
    }

    if (!refreshToken) {
      this.logger.warn('Refresh token not found');
      // Thrown rather than written directly so I18nExceptionFilter translates it.
      throw new UnauthorizedException('routes.auth.refresh_token_not_found');
    }

    let decoded: ReturnType<AdminAuthService['verifyRefreshToken']>;
    try {
      decoded = this.adminAuthService.verifyRefreshToken(refreshToken);
    } catch (jwtError) {
      this.logger.warn(`Invalid refresh token: ${jwtError}`);
      res.clearCookie('refreshToken');
      throw new UnauthorizedException('routes.auth.invalid_or_expired_refresh_token');
    }

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

    return {
      code: 200,
      success: true,
      message: 'routes.auth.tokens_refreshed',
      data: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('check-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @AdminCheckAuthEndpoint()
  async checkAuth(@Req() req: AuthenticatedRequest) {
    this.logger.debug('Check auth request');

    const unauthenticated = (message: string) => ({
      code: 200,
      success: true,
      message,
      data: {
        isAuthenticated: false,
      },
      timestamp: new Date().toISOString(),
    });

    try {
      if (req.user?.id) {
        const admin = await this.adminAuthService.getAdminById(req.user.id);

        // A still-valid access token must not keep a blocked admin "logged in":
        // report the session as unauthenticated so the client tears it down.
        if (admin.isBlocked) {
          return unauthenticated('routes.auth.check_completed');
        }

        return {
          code: 200,
          success: true,
          message: 'routes.auth.check_completed',
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
        };
      }

      return unauthenticated('routes.auth.check_completed');
    } catch (error) {
      this.logger.error(`Auth check failed: ${error}`);
      return unauthenticated('routes.auth.check_failed');
    }
  }

  @Post('create')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminCreateEndpoint()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAdminDto: CreateAdminDto) {
    const { email } = createAdminDto as { email: string };
    this.logger.debug(`Creating new admin: ${email}`);
    const result = await this.adminAuthService.createAdmin(createAdminDto);
    const { data } = result as { data: { id: string } };
    this.logger.log(`Admin created: ${data.id}`);
    return result;
  }

  @Patch(':id/block')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminBlockEndpoint()
  async blockAdmin(@Param('id', ParseUUIDPipe) id: string, @Body() blockAdminDto: BlockAdminDto) {
    this.logger.debug(`Updating block status for admin: ${id}`);
    const { isBlocked } = blockAdminDto;
    const result = await this.adminAuthService.blockAdmin(id, blockAdminDto);
    this.logger.log(`Admin block status updated: ${id} - blocked: ${isBlocked}`);
    return result;
  }

  @Patch(':id/update')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminUpdateEndpoint()
  async updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    this.logger.debug(`Updating admin: ${id}`);
    const result = await this.adminAuthService.updateAdmin(id, updateAdminDto);
    this.logger.log(`Admin updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminDeleteEndpoint()
  async deleteAdmin(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`Deleting admin: ${id}`);
    const result = await this.adminAuthService.deleteAdmin(id);
    this.logger.log(`Admin deleted: ${id}`);
    return result;
  }

  @Get()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @ApiBearerAuth('access-token')
  @AdminGetAllEndpoint()
  @PaginationDecorator()
  async getAllAdmins(@Query() query: GetAdminsQueryDto) {
    const { page = 1, limit = 10 } = query;
    this.logger.debug(`Fetching admins: page ${page}, limit ${limit}`);
    const result = await this.adminAuthService.getAllAdmins(query);
    const { data } = result as { data: { items: unknown[]; pagination: { total: number } } };
    this.logger.log(`Fetched admins: ${data.pagination.total}`);
    return result;
  }
}
