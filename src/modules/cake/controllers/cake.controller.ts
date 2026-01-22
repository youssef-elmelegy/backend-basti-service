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
import { CakeService } from '../services/cake.service';
import { CreateCakeDto, UpdateCakeDto, PaginationDto } from '../dto';
import {
  CreateCakeDecorator,
  GetAllCakesDecorator,
  GetCakeByIdDecorator,
  UpdateCakeDecorator,
  DeleteCakeDecorator,
  ToggleCakeStatusDecorator,
} from '../decorators';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';

@ApiTags('cake')
@Controller('cakes')
export class CakeController {
  private readonly logger = new Logger(CakeController.name);

  constructor(private readonly cakeService: CakeService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateCakeDecorator()
  async create(@Body() createCakeDto: CreateCakeDto) {
    this.logger.debug(`Creating cake: ${createCakeDto.name}`);
    const result = await this.cakeService.create(createCakeDto);
    const cakeData = result.data as Record<string, unknown>;
    this.logger.log(`Cake created: ${String(cakeData['id'] as string)}`);
    return result;
  }

  @Get()
  @Public()
  @GetAllCakesDecorator()
  async findAll(@Query() paginationDto: PaginationDto) {
    this.logger.debug(`Retrieving cakes: page ${paginationDto.page}, limit ${paginationDto.limit}`);
    return this.cakeService.findAll(paginationDto);
  }

  @Get(':id')
  @Public()
  @GetCakeByIdDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving cake: ${id}`);
    return this.cakeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateCakeDecorator()
  async update(@Param('id') id: string, @Body() updateCakeDto: UpdateCakeDto) {
    this.logger.debug(`Updating cake: ${id}`);
    const result = await this.cakeService.update(id, updateCakeDto);
    this.logger.log(`Cake updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteCakeDecorator()
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting cake: ${id}`);
    const result = await this.cakeService.remove(id);
    this.logger.log(`Cake deleted: ${id}`);
    return result;
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @ToggleCakeStatusDecorator()
  async toggleStatus(@Param('id') id: string) {
    this.logger.debug(`Toggling cake status: ${id}`);
    const result = await this.cakeService.toggleStatus(id);
    this.logger.log(`Cake status toggled: ${id}`);
    return result;
  }
}
