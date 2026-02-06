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
import { CreateChefDto, UpdateChefDto, PaginationDto, SortDto } from '../dto';
import {
  CreateChefDecorator,
  GetAllChefsDecorator,
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
  async findAll(@Query() query: { pagination: PaginationDto; sort: SortDto }) {
    this.logger.debug(`
      Retrieving chefs: page ${query.pagination.page}, limit ${query.pagination.limit}`);
    return this.chefService.findAll(query.pagination, query.sort);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving chef: ${id}`);
    return this.chefService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  async update(@Param('id') id: string, @Body() updateChefDto: UpdateChefDto) {
    this.logger.debug(`Updating chef: ${id}`);
    const result = await this.chefService.update(id, updateChefDto);
    this.logger.log(`Chef updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting chef: ${id}`);
    const result = await this.chefService.remove(id);
    this.logger.log(`Chef deleted: ${id}`);
    return result;
  }

  // @Post(':id/rate')
  // @RateChefDecorator()
  // async rateChef(
  //   @Param('id') id: string,
  //   @CurrentUser('sub') userId: string,
  //   @Body() rateChefDto: RateChefDto,
  // ) {
  //   this.logger.debug(`Rating chef: ${id} by user: ${userId}`);
  //   const result = await this.chefService.rateChef(id, userId, rateChefDto);
  //   this.logger.log(`Chef rated: ${id} (rating: ${rateChefDto.rating})`);
  //   return result;
  // }
}
