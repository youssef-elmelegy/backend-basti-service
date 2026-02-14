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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FlavorService } from '../services/flavor.service';
import {
  CreateFlavorDto,
  UpdateFlavorDto,
  GetFlavorsQueryDto,
  CreateFlavorRegionItemPriceDto,
} from '../dto';
import {
  CreateFlavorDecorator,
  GetAllFlavorsDecorator,
  GetFlavorByIdDecorator,
  UpdateFlavorDecorator,
  DeleteFlavorDecorator,
  CreateFlavorRegionItemPriceDecorator,
} from '../decorators';
import { Public } from '@/common';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';

@ApiTags('custom-cakes/flavors')
@Controller('custom-cakes/flavors')
export class FlavorController {
  private readonly logger = new Logger(FlavorController.name);

  constructor(private readonly flavorService: FlavorService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateFlavorDecorator()
  async create(@Body() createFlavorDto: CreateFlavorDto) {
    this.logger.debug(`Creating flavor: ${createFlavorDto.title}`);
    return this.flavorService.create(createFlavorDto);
  }

  @Get()
  @Public()
  @GetAllFlavorsDecorator()
  async findAll(@Query() query: GetFlavorsQueryDto) {
    this.logger.debug(`Retrieving flavors: page ${query.page}, limit ${query.limit}`);
    return this.flavorService.findAll(query);
  }

  @Get(':id')
  @Public()
  @GetFlavorByIdDecorator()
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Retrieving flavor: ${id}`);
    return this.flavorService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateFlavorDecorator()
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateFlavorDto: UpdateFlavorDto,
  ) {
    this.logger.debug(`Updating flavor: ${id}`);
    return this.flavorService.update(id, updateFlavorDto);
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteFlavorDecorator()
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Deleting flavor: ${id}`);
    return this.flavorService.remove(id);
  }

  @Post('region-pricing')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateFlavorRegionItemPriceDecorator()
  async createRegionItemPrice(
    @Body() createFlavorRegionItemPriceDto: CreateFlavorRegionItemPriceDto,
  ) {
    return this.flavorService.createRegionItemPrice(createFlavorRegionItemPriceDto);
  }
}
