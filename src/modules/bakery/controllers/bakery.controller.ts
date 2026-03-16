import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BakeryService } from '../services/bakery.service';
import { BakeryItemStoreService } from '../services/bakery-item-store.service';
import {
  CreateBakeryDto,
  UpdateBakeryDto,
  BakeryResponse,
  PaginationDto,
  SortDto,
  UpdateBakeryItemStockDto,
} from '../dto';
import { SortType, SortOrder } from '@/common/dto';
import {
  CreateBakeryDecorator,
  GetAllBakeriesDecorator,
  GetBakeryDecorator,
  UpdateBakeryDecorator,
  DeleteBakeryDecorator,
  GetBakeryItemStoresDecorator,
  UpdateBakeryItemStockDecorator,
  PaginationDecorator,
  SortDecorator,
  FilterDecorator,
} from '../decorators';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { SuccessResponse } from '@/utils';

@ApiTags('bakery')
@Controller('bakeries')
export class BakeryController {
  private readonly logger = new Logger(BakeryController.name);

  constructor(
    private readonly bakeryService: BakeryService,
    private readonly bakeryItemStoreService: BakeryItemStoreService,
  ) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateBakeryDecorator()
  async create(@Body() createBakeryDto: CreateBakeryDto): Promise<SuccessResponse<BakeryResponse>> {
    this.logger.debug(`Creating bakery: ${createBakeryDto.name}`);
    const result = await this.bakeryService.create(createBakeryDto);
    this.logger.log(`Bakery created: ${result.data.id}`);
    return result;
  }

  @Get()
  @GetAllBakeriesDecorator()
  @PaginationDecorator()
  @SortDecorator()
  @FilterDecorator()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sort') sort: string = 'created_at',
    @Query('order') order: string = 'desc',
  ) {
    this.logger.debug('Retrieving all bakeries');
    const pagination: PaginationDto = {
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.max(1, parseInt(limit, 10) || 10),
    };
    const sortDto: SortDto = {
      sort: (sort === 'alpha' || sort === 'created_at' ? sort : 'created_at') as SortType,
      order: (order === 'asc' || order === 'desc' ? order : 'desc') as SortOrder,
    };
    return this.bakeryService.findAll(pagination, sortDto);
  }

  @Get(':id')
  @GetBakeryDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving bakery: ${id}`);
    return this.bakeryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateBakeryDecorator()
  async update(@Param('id') id: string, @Body() updateBakeryDto: UpdateBakeryDto) {
    this.logger.debug(`Updating bakery: ${id}`);
    const result = await this.bakeryService.update(id, updateBakeryDto);
    this.logger.log(`Bakery updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteBakeryDecorator()
  async remove(@Param('id') id: string): Promise<SuccessResponse<{ message: string }>> {
    this.logger.debug(`Deleting bakery: ${id}`);
    const result = await this.bakeryService.remove(id);
    this.logger.log(`Bakery deleted: ${id}`);
    return result;
  }

  @Get(':bakeryId/items')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @GetBakeryItemStoresDecorator()
  async getBakeryItemStores(@Param('bakeryId') bakeryId: string) {
    this.logger.debug(`Retrieving item stores for bakery: ${bakeryId}`);
    return this.bakeryItemStoreService.getBakeryItemStores(bakeryId);
  }

  @Patch(':bakeryId/items/:storeId/stock')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateBakeryItemStockDecorator()
  async updateItemStock(
    @Param('bakeryId') bakeryId: string,
    @Param('storeId') storeId: string,
    @Body() updateStockDto: UpdateBakeryItemStockDto,
  ) {
    this.logger.debug(`Updating stock for item store: ${storeId} in bakery: ${bakeryId}`);
    return this.bakeryItemStoreService.updateStock(storeId, updateStockDto);
  }
}
