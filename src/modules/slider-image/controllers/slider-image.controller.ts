import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  ParseArrayPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SliderImageService } from '../services/slider-image.service';
import {
  SliderImageResponseDto,
  SliderImageItemDto,
  SliderImageWithTagsResponseDto,
  ChangeSliderImageOrderDto,
} from '../dto';
import {
  GetSliderImagesDecorator,
  UpdateSliderImagesDecorator,
  DeleteSliderImagesDecorator,
  ChangeSliderImageOrderDecorator,
} from '../decorators';
import { Public } from '@/common';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { SuccessResponse } from '@/utils';

@ApiTags('slider-images')
@Controller('slider-images')
export class SliderImageController {
  private readonly logger = new Logger(SliderImageController.name);

  constructor(private readonly sliderImageService: SliderImageService) {}

  /** Customer-facing listing: hidden images are never served here. */
  @Public()
  @Get()
  @GetSliderImagesDecorator()
  async findAll(): Promise<SuccessResponse<SliderImageWithTagsResponseDto[]>> {
    this.logger.debug('Retrieving visible slider images');
    return this.sliderImageService.findAll(false);
  }

  /**
   * Admin listing, which also returns images hidden by a tag deletion so they
   * can be re-linked. Kept as its own route because the public one above skips
   * JWT parsing entirely, leaving no identity to authorize a query flag against.
   */
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('admin')
  @GetSliderImagesDecorator()
  async findAllForAdmin(): Promise<SuccessResponse<SliderImageWithTagsResponseDto[]>> {
    this.logger.debug('Retrieving all slider images (admin)');
    return this.sliderImageService.findAll(true);
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Post()
  @UpdateSliderImagesDecorator()
  async update(
    @Body(new ParseArrayPipe({ items: SliderImageItemDto }))
    images: SliderImageItemDto[],
  ): Promise<SuccessResponse<SliderImageResponseDto[]>> {
    this.logger.debug(`Updating slider images with ${images.length} images`);
    const result = await this.sliderImageService.update(images);
    this.logger.log(`Slider images updated successfully`);
    return result;
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Patch(':id/order')
  @ChangeSliderImageOrderDecorator()
  async changeOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() changeOrderDto: ChangeSliderImageOrderDto,
  ): Promise<SuccessResponse<SliderImageResponseDto[]>> {
    this.logger.debug(`Changing slider image order: ${id} to ${changeOrderDto.displayOrder}`);
    const result = await this.sliderImageService.changeOrder(id, changeOrderDto);
    this.logger.log(`Slider image order changed: ${id}`);
    return result;
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Delete(':id')
  @DeleteSliderImagesDecorator()
  async remove(@Param('id') id: string): Promise<SuccessResponse<{ message: string }>> {
    this.logger.debug(`Deleting slider image: ${id}`);
    const result = await this.sliderImageService.remove(id);
    this.logger.log(`Slider image deleted: ${id}`);
    return result;
  }
}
