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
import { AddService } from '../services/add.service';
import { CreateAddDto, UpdateAddDto, PaginationDto, SortDto } from '../dto';
import {
  CreateAddDecorator,
  GetAllAddsDecorator,
  GetAddByIdDecorator,
  UpdateAddDecorator,
  DeleteAddDecorator,
  ToggleAddStatusDecorator,
  PaginationDecorator,
  SortDecorator,
  FilterDecorator,
} from '../decorators';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';

@ApiTags('addon')
@Controller('adds')
export class AddController {
  private readonly logger = new Logger(AddController.name);

  constructor(private readonly addService: AddService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateAddDecorator()
  async create(@Body() createAddDto: CreateAddDto) {
    this.logger.debug(`Creating add-on: ${createAddDto.name}`);
    const result = await this.addService.create(createAddDto);
    const addData = result.data as Record<string, unknown>;
    this.logger.log(`Add-on created: ${String(addData['id'] as string)}`);
    return result;
  }

  @Get()
  @Public()
  @GetAllAddsDecorator()
  @PaginationDecorator()
  @FilterDecorator()
  @SortDecorator()
  async findAll(@Query() query: { pagination: PaginationDto; sort: SortDto }) {
    this.logger.debug(
      `Retrieving add-ons: page ${query.pagination.page}, limit ${query.pagination.limit}`,
    );
    return this.addService.findAll(query.pagination, query.sort);
  }

  @Get(':id')
  @Public()
  @GetAddByIdDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving add-on: ${id}`);
    return this.addService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateAddDecorator()
  async update(@Param('id') id: string, @Body() updateAddDto: UpdateAddDto) {
    this.logger.debug(`Updating add-on: ${id}`);
    const result = await this.addService.update(id, updateAddDto);
    this.logger.log(`Add-on updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteAddDecorator()
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting add-on: ${id}`);
    const result = await this.addService.remove(id);
    this.logger.log(`Add-on deleted: ${id}`);
    return result;
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @ToggleAddStatusDecorator()
  async toggleStatus(@Param('id') id: string) {
    this.logger.debug(`Toggling add-on status: ${id}`);
    const result = await this.addService.toggleStatus(id);
    this.logger.log(`Add-on status toggled: ${id}`);
    return result;
  }
}
