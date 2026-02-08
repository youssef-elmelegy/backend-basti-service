import { Controller, Get, Post, Delete, Body, Param, Logger, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TagsService } from '../services/tags.service';
import { GetTagsDecorator, CreateTagDecorator, DeleteTagDecorator } from '../decorators';
import { CreateTagDto, TagDto } from '../dto';
import { Public } from '@/common';
import { SuccessResponse } from '@/utils';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Public()
  @GetTagsDecorator()
  async findAll(): Promise<SuccessResponse<TagDto[]>> {
    this.logger.debug('Retrieving all tags');
    return this.tagsService.findAll();
  }

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateTagDecorator()
  async create(@Body() createTagDto: CreateTagDto): Promise<SuccessResponse<TagDto>> {
    return this.tagsService.create(createTagDto);
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteTagDecorator()
  async remove(@Param('id') id: string): Promise<SuccessResponse<{ message: string }>> {
    this.logger.debug(`Deleting tag: ${id}`);
    return this.tagsService.remove(id);
  }
}
