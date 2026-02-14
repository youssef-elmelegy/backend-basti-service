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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShapeService } from '../services/shape.service';
import {
  CreateShapeDto,
  UpdateShapeDto,
  GetShapesQueryDto,
  CreateShapeRegionItemPriceDto,
} from '../dto';
import {
  CreateShapeDecorator,
  GetAllShapesDecorator,
  GetShapeByIdDecorator,
  UpdateShapeDecorator,
  DeleteShapeDecorator,
  CreateShapeRegionItemPriceDecorator,
} from '../decorators';
import { Public } from '@/common';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';

@ApiTags('custom-cakes/shapes')
@Controller('custom-cakes/shapes')
export class ShapeController {
  private readonly logger = new Logger(ShapeController.name);

  constructor(private readonly shapeService: ShapeService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateShapeDecorator()
  async create(@Body() createShapeDto: CreateShapeDto) {
    this.logger.debug(`Creating shape: ${createShapeDto.title}`);
    return this.shapeService.create(createShapeDto);
  }

  @Get()
  @Public()
  @GetAllShapesDecorator()
  async findAll(@Query() query: GetShapesQueryDto) {
    this.logger.debug(`Retrieving shapes: page ${query.page}, limit ${query.limit}`);
    return this.shapeService.findAll(query);
  }

  @Get(':id')
  @Public()
  @GetShapeByIdDecorator()
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Retrieving shape: ${id}`);
    return this.shapeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateShapeDecorator()
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateShapeDto: UpdateShapeDto,
  ) {
    this.logger.debug(`Updating shape: ${id}`);
    return this.shapeService.update(id, updateShapeDto);
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteShapeDecorator()
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Deleting shape: ${id}`);
    return this.shapeService.remove(id);
  }

  @Post('region-pricing')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateShapeRegionItemPriceDecorator()
  async createRegionItemPrice(
    @Body() createShapeRegionItemPriceDto: CreateShapeRegionItemPriceDto,
  ) {
    return this.shapeService.createRegionItemPrice(createShapeRegionItemPriceDto);
  }
}
