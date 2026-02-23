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
import { DecorationService } from '../services/decoration.service';
import {
  CreateDecorationDto,
  UpdateDecorationDto,
  GetDecorationsQueryDto,
  CreateDecorationRegionItemPriceDto,
  CreateDecorationWithVariantImagesDto,
} from '../dto';
import {
  CreateDecorationDecorator,
  GetAllDecorationsDecorator,
  GetDecorationByIdDecorator,
  UpdateDecorationDecorator,
  DeleteDecorationDecorator,
  CreateDecorationRegionItemPriceDecorator,
  CreateDecorationWithVariantImagesDecorator,
} from '../decorators';
import { Public } from '@/common';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';

@ApiTags('custom-cakes/decorations')
@Controller('custom-cakes/decorations')
export class DecorationController {
  private readonly logger = new Logger(DecorationController.name);

  constructor(private readonly decorationService: DecorationService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateDecorationDecorator()
  async create(@Body() createDecorationDto: CreateDecorationDto) {
    this.logger.debug(`Creating decoration: ${createDecorationDto.title}`);
    return this.decorationService.create(createDecorationDto);
  }

  @Get()
  @Public()
  @GetAllDecorationsDecorator()
  async findAll(@Query() query: GetDecorationsQueryDto) {
    this.logger.debug(`Retrieving decorations: page ${query.page}, limit ${query.limit}`);
    return this.decorationService.findAll(query);
  }

  @Get(':id')
  @Public()
  @GetDecorationByIdDecorator()
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Retrieving decoration: ${id}`);
    return this.decorationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @UpdateDecorationDecorator()
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDecorationDto: UpdateDecorationDto,
  ) {
    this.logger.debug(`Updating decoration: ${id}`);
    return this.decorationService.update(id, updateDecorationDto);
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteDecorationDecorator()
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    this.logger.debug(`Deleting decoration: ${id}`);
    return this.decorationService.remove(id);
  }

  @Post('region-pricing')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateDecorationRegionItemPriceDecorator()
  async createRegionItemPrice(
    @Body() createDecorationRegionItemPriceDto: CreateDecorationRegionItemPriceDto,
  ) {
    return this.decorationService.createRegionItemPrice(createDecorationRegionItemPriceDto);
  }

  @Post('with-variant-images')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @CreateDecorationWithVariantImagesDecorator()
  async createWithVariantImages(
    @Body() createDecorationWithVariantImagesDto: CreateDecorationWithVariantImagesDto,
  ) {
    this.logger.debug(
      `Creating decoration with variant images: ${createDecorationWithVariantImagesDto.title}`,
    );
    return this.decorationService.createWithVariantImages(createDecorationWithVariantImagesDto);
  }
}
