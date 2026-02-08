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
import { FeaturedCakeService } from '../services/featured-cake.service';
import { CreateFeaturedCakeDto, UpdateFeaturedCakeDto, GetFeaturedCakesQueryDto } from '../dto';
import {
  CreateFeaturedCakeDecorator,
  GetAllFeaturedCakesDecorator,
  GetFeaturedCakeByIdDecorator,
  UpdateFeaturedCakeDecorator,
  DeleteFeaturedCakeDecorator,
  ToggleFeaturedCakeStatusDecorator,
} from '../decorators';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { Public } from '@/common';

@ApiTags('featured-cakes')
@Controller('featured-cakes')
export class FeaturedCakeController {
  private readonly logger = new Logger(FeaturedCakeController.name);

  constructor(private readonly featuredCakeService: FeaturedCakeService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateFeaturedCakeDecorator()
  async create(@Body() createFeaturedCakeDto: CreateFeaturedCakeDto) {
    this.logger.debug(`Creating featured cake: ${createFeaturedCakeDto.name}`);
    const result = await this.featuredCakeService.create(createFeaturedCakeDto);
    const cakeData = result.data as Record<string, unknown>;
    this.logger.log(`Featured cake created: ${String(cakeData['id'] as string)}`);
    return result;
  }

  @Get()
  @Public()
  @GetAllFeaturedCakesDecorator()
  async findAll(@Query() query: GetFeaturedCakesQueryDto) {
    this.logger.debug(`
      Retrieving featured cakes: page ${query.page}, limit ${query.limit}`);
    return this.featuredCakeService.findAll(query);
  }

  @Get(':id')
  @Public()
  @GetFeaturedCakeByIdDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving featured cake: ${id}`);
    return this.featuredCakeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateFeaturedCakeDecorator()
  async update(@Param('id') id: string, @Body() updateFeaturedCakeDto: UpdateFeaturedCakeDto) {
    this.logger.debug(`Updating featured cake: ${id}`);
    const result = await this.featuredCakeService.update(id, updateFeaturedCakeDto);
    this.logger.log(`Featured cake updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteFeaturedCakeDecorator()
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting featured cake: ${id}`);
    const result = await this.featuredCakeService.remove(id);
    this.logger.log(`Featured cake deleted: ${id}`);
    return result;
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @ToggleFeaturedCakeStatusDecorator()
  async toggleStatus(@Param('id') id: string) {
    this.logger.debug(`Toggling featured cake status: ${id}`);
    const result = await this.featuredCakeService.toggleStatus(id);
    this.logger.log(`Featured cake status toggled: ${id}`);
    return result;
  }
}
