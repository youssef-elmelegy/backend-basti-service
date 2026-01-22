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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BakeryService } from '../services/bakery.service';
import { CreateBakeryDto, UpdateBakeryDto, BakeryResponse } from '../dto';
import {
  CreateBakeryDecorator,
  GetAllBakeriesDecorator,
  GetBakeryDecorator,
  UpdateBakeryDecorator,
  DeleteBakeryDecorator,
} from '../decorators';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';
import { SuccessResponse } from '@/utils';

@Public()
@ApiTags('bakery')
@Controller('bakeries')
export class BakeryController {
  private readonly logger = new Logger(BakeryController.name);

  constructor(private readonly bakeryService: BakeryService) {}

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
  async findAll() {
    this.logger.debug('Retrieving all bakeries');
    return this.bakeryService.findAll();
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
}
