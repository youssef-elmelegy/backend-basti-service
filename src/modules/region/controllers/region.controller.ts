import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, Query } from '@nestjs/common';
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
} from '../decorators';
import { Public } from '@/common';

@Public()
@ApiTags('region')
@Controller('regions')
export class RegionController {
  private readonly logger = new Logger(RegionController.name);

  constructor(private readonly regionService: RegionService) {}

  @Post()
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
  @UpdateRegionDecorator()
  async update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    this.logger.debug(`Updating region: ${id}`);
    const result = await this.regionService.update(id, updateRegionDto);
    this.logger.log(`Region updated: ${id}`);
    return result;
  }

  @Delete(':id')
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
}
