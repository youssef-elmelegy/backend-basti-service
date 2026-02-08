import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  ParseArrayPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SliderImageService } from '../services/slider-image.service';
import { SliderImageResponseDto, SliderImageItemDto } from '../dto';
import {
  GetSliderImagesDecorator,
  UpdateSliderImagesDecorator,
  DeleteSliderImagesDecorator,
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

  @Public()
  @Get()
  @GetSliderImagesDecorator()
  async findAll(): Promise<SuccessResponse<SliderImageResponseDto[]>> {
    this.logger.debug('Retrieving all slider images');
    return this.sliderImageService.findAll();
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
  @Delete(':id')
  @DeleteSliderImagesDecorator()
  async remove(@Param('id') id: string): Promise<SuccessResponse<{ message: string }>> {
    this.logger.debug(`Deleting slider image: ${id}`);
    const result = await this.sliderImageService.remove(id);
    this.logger.log(`Slider image deleted: ${id}`);
    return result as SuccessResponse<{ message: string }>;
  }
}
