import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegionService } from '../services/region.service';
import {
  CreateRegionDto,
  UpdateRegionDto,
  GetRegionsQueryDto,
  GetRegionalProductsQueryDto,
} from '../dto';
import {
  CreateRegionDecorator,
  GetAllRegionsDecorator,
  GetRegionDecorator,
  UpdateRegionDecorator,
  DeleteRegionDecorator,
  GetRegionalProductsDecorator,
  DeleteRegionalItemPriceDecorator,
} from '../decorators';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';

@ApiTags('region')
@Controller('regions')
export class RegionController {
  private readonly logger = new Logger(RegionController.name);

  constructor(private readonly regionService: RegionService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateRegionDecorator()
  async create(@Body() createRegionDto: CreateRegionDto) {
    this.logger.debug(`Creating region: ${createRegionDto.name}`);
    const result = await this.regionService.create(createRegionDto);
    this.logger.log(`Region created: ${result.data.id}`);
    return result;
  }

  @Get()
  @GetAllRegionsDecorator()
  async findAll(@Query() query: GetRegionsQueryDto) {
    this.logger.debug('Retrieving all regions');
    return this.regionService.findAll(query);
  }

  @Get(':id')
  @GetRegionDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving region: ${id}`);
    return this.regionService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateRegionDecorator()
  async update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    this.logger.debug(`Updating region: ${id}`);
    const result = await this.regionService.update(id, updateRegionDto);
    this.logger.log(`Region updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteRegionDecorator()
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting region: ${id}`);
    const result = await this.regionService.remove(id);
    this.logger.log(`Region deleted: ${id}`);
    return result;
  }

  @Get(':id/products')
  @GetRegionalProductsDecorator()
  async getRegionalProducts(
    @Param('id') regionId: string,
    @Query() query: GetRegionalProductsQueryDto,
  ): Promise<any> {
    this.logger.debug(`Retrieving products for region: ${regionId}`);
    const result = await this.regionService.getRegionalProducts(regionId, query);
    this.logger.log(`Regional products retrieved for region: ${regionId}`);
    return result;
  }

  @Delete(':regionId/products/:productType/:productId')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteRegionalItemPriceDecorator()
  async removeRegionalItemPrice(
    @Param('regionId') regionId: string,
    @Param('productType') productType: string,
    @Param('productId') productId: string,
  ) {
    this.logger.debug(
      `Deleting regional item price: ${productType} (${productId}) from region: ${regionId}`,
    );
    const result = await this.regionService.removeRegionalItemPrice(
      regionId,
      productType,
      productId,
    );
    this.logger.log(`Regional item price deleted: ${productType} (${productId})`);
    return result;
  }
}
