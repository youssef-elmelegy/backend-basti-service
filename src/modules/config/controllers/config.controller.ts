import { Controller, Get, Patch, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '../services/config.service';
import { UpdateConfigDto } from '../dto';
import { GetConfigDecorator, UpdateConfigDecorator } from '../decorators';
import { Public } from '@/common';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { successResponse } from '@/utils';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private readonly configService: ConfigService) {}

  @Public()
  @Get()
  @GetConfigDecorator()
  async get() {
    this.logger.debug('Retrieving app config');
    const result = await this.configService.get();
    return successResponse(result, 'Config retrieved successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Patch()
  @UpdateConfigDecorator()
  async update(@Body() updateConfigDto: UpdateConfigDto) {
    this.logger.debug('Updating app config');
    const result = await this.configService.update(updateConfigDto);
    this.logger.log('App config updated successfully');
    return successResponse(result, 'Config updated successfully');
  }
}
