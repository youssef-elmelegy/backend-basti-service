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
import { ChefService } from '../services/chef.service';
import { CreateChefDto, UpdateChefDto, GetChefsQueryDto } from '../dto';
import {
  CreateChefDecorator,
  GetAllChefsDecorator,
  GetOneChefDecorator,
  UpdateChefDecorator,
  DeleteChefDecorator,
  SortDecorator,
  PaginationDecorator,
  FilterDecorator,
} from '../decorators';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';

@ApiTags('chef')
@Controller('chefs')
export class ChefController {
  private readonly logger = new Logger(ChefController.name);

  constructor(private readonly chefService: ChefService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateChefDecorator()
  async create(@Body() createChefDto: CreateChefDto) {
    this.logger.debug(`Creating chef: ${createChefDto.name}`);
    const result = await this.chefService.create(createChefDto);
    this.logger.log(`Chef created: ${result.data.id}`);
    return result;
  }

  @Get()
  @Public()
  @GetAllChefsDecorator()
  @PaginationDecorator()
  @SortDecorator()
  @FilterDecorator()
  async findAll(@Query() query: GetChefsQueryDto) {
    const { page = 1, limit = 10, sort = 'created_at', order = 'asc', regionId } = query;

    this.logger.debug(
      `Retrieving chefs: page ${page}, limit ${limit}, region: ${regionId || 'all'}`,
    );
    return this.chefService.findAll({ page, limit }, { sort, order }, regionId);
  }

  @Get(':id')
  @Public()
  @GetOneChefDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving chef: ${id}`);
    return this.chefService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateChefDecorator()
  async update(@Param('id') id: string, @Body() updateChefDto: UpdateChefDto) {
    this.logger.debug(`Updating chef: ${id}`);
    const result = await this.chefService.update(id, updateChefDto);
    this.logger.log(`Chef updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteChefDecorator()
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting chef: ${id}`);
    const result = await this.chefService.remove(id);
    this.logger.log(`Chef deleted: ${id}`);
    return result;
  }
}
