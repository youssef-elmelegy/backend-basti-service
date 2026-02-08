import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddonService } from '../services/addon.service';
import {
  CreateAddonDto,
  UpdateAddonDto,
  GetAddonsQueryDto,
  CreateAddonRegionItemPriceDto,
} from '../dto';
import {
  CreateAddonDecorator,
  GetAllAddonsDecorator,
  GetAddonByIdDecorator,
  UpdateAddonDecorator,
  DeleteAddonDecorator,
  ToggleAddonStatusDecorator,
  CreateAddonRegionItemPriceDecorator,
} from '../decorators';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';

@ApiTags('addon')
@Controller('addons')
export class AddonController {
  private readonly logger = new Logger(AddonController.name);

  constructor(private readonly addonService: AddonService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateAddonDecorator()
  async create(@Body() createAddonDto: CreateAddonDto) {
    this.logger.debug(`Creating add-on: ${createAddonDto.name}`);
    const result = await this.addonService.create(createAddonDto);
    const addonData = result.data as Record<string, unknown>;
    this.logger.log(`Add-on created: ${String(addonData['id'] as string)}`);
    return result;
  }

  @Get()
  @Public()
  @GetAllAddonsDecorator()
  async findAll(@Query() query: GetAddonsQueryDto) {
    this.logger.debug(`Retrieving add-ons: page ${query.page}, limit ${query.limit}`);
    return this.addonService.findAll(query);
  }

  @Get(':id')
  @Public()
  @GetAddonByIdDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving add-on: ${id}`);
    return this.addonService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateAddonDecorator()
  async update(@Param('id') id: string, @Body() updateAddonDto: UpdateAddonDto) {
    this.logger.debug(`Updating add-on: ${id}`);
    const result = await this.addonService.update(id, updateAddonDto);
    this.logger.log(`Add-on updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteAddonDecorator()
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting add-on: ${id}`);
    const result = await this.addonService.remove(id);
    this.logger.log(`Add-on deleted: ${id}`);
    return result;
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @ToggleAddonStatusDecorator()
  async toggleStatus(@Param('id') id: string) {
    this.logger.debug(`Toggling add-on status: ${id}`);
    const result = await this.addonService.toggleStatus(id);
    this.logger.log(`Add-on status toggled: ${id}`);
    return result;
  }

  @Post('region-pricing')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateAddonRegionItemPriceDecorator()
  async createRegionItemPrice(
    @Body() createAddonRegionItemPriceDto: CreateAddonRegionItemPriceDto,
  ) {
    const { addonId } = createAddonRegionItemPriceDto;
    this.logger.debug(`Creating region pricing for addon: ${String(addonId)}`);
    const result = await this.addonService.createRegionItemPrice(createAddonRegionItemPriceDto);
    return result;
  }
}
