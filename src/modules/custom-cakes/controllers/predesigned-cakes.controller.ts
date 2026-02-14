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
  Inject,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PredesignedCakesService } from '../services/predesigned-cakes.service';
import {
  CreatePredesignedCakeDto,
  UpdatePredesignedCakeDto,
  GetPredesignedCakesQueryDto,
  CheckEntityRegionAvailabilityDto,
  CreatePredesignedCakeRegionItemPriceDto,
} from '../dto';
import {
  CreatePredesignedCakeDecorator,
  GetAllPredesignedCakesDecorator,
  GetPredesignedCakeByIdDecorator,
  UpdatePredesignedCakeDecorator,
  DeletePredesignedCakeDecorator,
  CheckEntityRegionAvailabilityDecorator,
  CreatePredesignedCakeRegionItemPriceDecorator,
} from '../decorators';
import { Public } from '@/common';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';

@ApiTags('custom-cakes/predesigned-cakes')
@Controller('custom-cakes/predesigned-cakes')
export class PredesignedCakesController {
  private readonly logger = new Logger(PredesignedCakesController.name);

  constructor(
    private readonly predesignedCakesService: PredesignedCakesService,
    @Inject('PREDESIGNED_CAKES_REGION_PRICING_SERVICE')
    private readonly regionPricingService: PredesignedCakesService,
  ) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreatePredesignedCakeDecorator()
  async create(@Body() createPredesignedCakeDto: CreatePredesignedCakeDto) {
    return this.predesignedCakesService.create(createPredesignedCakeDto);
  }

  @Get()
  @Public()
  @GetAllPredesignedCakesDecorator()
  async findAll(@Query() query: GetPredesignedCakesQueryDto) {
    return this.predesignedCakesService.findAll(query);
  }

  @Get(':id')
  @Public()
  @GetPredesignedCakeByIdDecorator()
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Retrieving predesigned cake: ${id}`);
    return this.predesignedCakesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdatePredesignedCakeDecorator()
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePredesignedCakeDto: UpdatePredesignedCakeDto,
  ) {
    this.logger.debug(`Updating predesigned cake: ${id}`);
    return this.predesignedCakesService.update(id, updatePredesignedCakeDto);
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeletePredesignedCakeDecorator()
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Deleting predesigned cake: ${id}`);
    return this.predesignedCakesService.remove(id);
  }

  @Post('check-availability')
  @Public()
  @CheckEntityRegionAvailabilityDecorator()
  async checkEntityRegionAvailability(@Body() checkDto: CheckEntityRegionAvailabilityDto) {
    return this.predesignedCakesService.checkEntityRegionAvailability(checkDto);
  }

  @Post('region-pricing')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreatePredesignedCakeRegionItemPriceDecorator()
  async createRegionItemPrice(
    @Body() createRegionPricingDto: CreatePredesignedCakeRegionItemPriceDto,
  ) {
    return this.regionPricingService.createRegionItemPrice(createRegionPricingDto);
  }
}
