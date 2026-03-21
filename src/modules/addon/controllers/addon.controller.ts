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
import { AddonOptionService } from '../services/addon-option.service';
import {
  CreateAddonDto,
  UpdateAddonDto,
  GetAddonsQueryDto,
  CreateAddonRegionItemPriceDto,
  CreateAddonOptionDto,
  UpdateAddonOptionDto,
} from '../dto';
import {
  CreateAddonDecorator,
  GetAllAddonsDecorator,
  GetAddonByIdDecorator,
  UpdateAddonDecorator,
  DeleteAddonDecorator,
  ToggleAddonStatusDecorator,
  CreateAddonRegionItemPriceDecorator,
  CreateAddonOptionDecorator,
  UpdateAddonOptionDecorator,
  DeleteAddonOptionDecorator,
} from '../decorators';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';

@ApiTags('addon')
@Controller('addons')
export class AddonController {
  private readonly logger = new Logger(AddonController.name);

  constructor(
    private readonly addonService: AddonService,
    private readonly addonOptionService: AddonOptionService,
  ) {}

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

  @Post(':addonId/options')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateAddonOptionDecorator()
  async addOption(
    @Param('addonId') addonId: string,
    @Body() createAddonOptionDto: CreateAddonOptionDto,
  ) {
    this.logger.debug(`Adding option to add-on: ${addonId}`);
    const result = await this.addonOptionService.addOption(addonId, createAddonOptionDto);
    this.logger.log(`Option added to add-on: ${addonId}`);
    return result;
  }

  @Patch(':addonId/options/:optionId')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateAddonOptionDecorator()
  async updateOption(
    @Param('addonId') addonId: string,
    @Param('optionId') optionId: string,
    @Body() updateAddonOptionDto: UpdateAddonOptionDto,
  ) {
    this.logger.debug(`Updating option ${optionId} for add-on: ${addonId}`);
    const result = await this.addonOptionService.updateOption(
      addonId,
      optionId,
      updateAddonOptionDto,
    );
    this.logger.log(`Option updated: ${optionId}`);
    return result;
  }

  @Delete(':addonId/options/:optionId')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteAddonOptionDecorator()
  async removeOption(@Param('addonId') addonId: string, @Param('optionId') optionId: string) {
    this.logger.debug(`Removing option ${optionId} from add-on: ${addonId}`);
    const result = await this.addonOptionService.removeOption(addonId, optionId);
    this.logger.log(`Option removed: ${optionId}`);
    return result;
  }
}
