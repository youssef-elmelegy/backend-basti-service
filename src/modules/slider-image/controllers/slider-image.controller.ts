import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SliderImageService } from '../services/slider-image.service';
import { SliderImageResponseDto } from '../dto';
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
import { errorResponse } from '@/utils';

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
  async update(@Body() imageUrls: string[]): Promise<SuccessResponse<SliderImageResponseDto[]>> {
    if (!Array.isArray(imageUrls)) {
      throw new BadRequestException(
        errorResponse(
          'Request body must be an array of image URLs',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    if (imageUrls.length === 0) {
      throw new BadRequestException(
        errorResponse(
          'At least one image URL must be provided',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    // Validate each URL
    const invalidUrls = imageUrls.filter((url) => {
      if (typeof url !== 'string') return true;
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      throw new BadRequestException(
        errorResponse(
          'All image URLs must be valid URLs',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    this.logger.debug(`Updating slider images with ${imageUrls.length} URLs`);
    const result = await this.sliderImageService.update({ imageUrls });
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
