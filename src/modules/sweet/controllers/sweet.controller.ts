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
import { SweetService } from '../services/sweet.service';
import { CreateSweetDto, UpdateSweetDto, GetSweetsQueryDto } from '../dto';
import {
  CreateSweetDecorator,
  GetAllSweetsDecorator,
  GetSweetByIdDecorator,
  UpdateSweetDecorator,
  DeleteSweetDecorator,
  ToggleSweetStatusDecorator,
} from '../decorators';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';

@ApiTags('sweets')
@Controller('sweets')
export class SweetController {
  private readonly logger = new Logger(SweetController.name);

  constructor(private readonly sweetService: SweetService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateSweetDecorator()
  async create(@Body() createSweetDto: CreateSweetDto) {
    this.logger.debug(`Creating sweet: ${createSweetDto.name}`);
    const result = await this.sweetService.create(createSweetDto);
    return result;
  }

  @Get()
  @Public()
  @GetAllSweetsDecorator()
  async findAll(@Query() query: GetSweetsQueryDto) {
    this.logger.debug(`Retrieving sweets: page ${query.page}, limit ${query.limit}`);
    return this.sweetService.findAll(query);
  }

  @Get(':id')
  @Public()
  @GetSweetByIdDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving sweet: ${id}`);
    return this.sweetService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateSweetDecorator()
  async update(@Param('id') id: string, @Body() updateSweetDto: UpdateSweetDto) {
    this.logger.debug(`Updating sweet: ${id}`);
    const result = await this.sweetService.update(id, updateSweetDto);
    this.logger.log(`Sweet updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteSweetDecorator()
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting sweet: ${id}`);
    const result = await this.sweetService.remove(id);
    this.logger.log(`Sweet deleted: ${id}`);
    return result;
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @ToggleSweetStatusDecorator()
  async toggleStatus(@Param('id') id: string) {
    this.logger.debug(`Toggling sweet status: ${id}`);
    const result = await this.sweetService.toggleStatus(id);
    this.logger.log(`Sweet status toggled: ${id}`);
    return result;
  }
}
