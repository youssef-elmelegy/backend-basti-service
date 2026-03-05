import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common';
import { JwtAuthGuard, AdminRoles, AdminRolesGuard, JwtWithAdminGuard } from '@/common/guards';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto, UpdateReviewDto } from '../dto';
import {
  CreateReviewDecorator,
  GetReviewsByBakeryDecorator,
  GetMyReviewsDecorator,
  GetReviewByIdDecorator,
  UpdateReviewDecorator,
  DeleteReviewDecorator,
  AdminDeleteReviewDecorator,
} from '../decorators';
import { successResponse } from '@/utils';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  private readonly logger = new Logger(ReviewController.name);

  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @CreateReviewDecorator()
  async create(@Body() createReviewDto: CreateReviewDto, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Creating review for user: ${userId}`);
    const result = await this.reviewService.create(userId, createReviewDto);
    this.logger.log(`Review created for user: ${userId}`);
    return successResponse(result, 'Review created successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('bakery/:bakeryId')
  @GetReviewsByBakeryDecorator()
  async findAllByBakery(@Param('bakeryId', ParseUUIDPipe) bakeryId: string) {
    this.logger.debug(`Fetching reviews for bakery: ${bakeryId}`);
    const result = await this.reviewService.findAllByBakery(bakeryId);
    return successResponse(result, 'Reviews fetched successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-reviews')
  @GetMyReviewsDecorator()
  async findMyReviews(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Fetching reviews for user: ${userId}`);
    const result = await this.reviewService.findAllByUser(userId);
    return successResponse(result, 'Reviews fetched successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get(':id')
  @GetReviewByIdDecorator()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`Fetching review: ${id}`);
    const result = await this.reviewService.findOne(id);
    return successResponse(result, 'Review fetched successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UpdateReviewDecorator()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Updating review: ${id} for user: ${userId}`);
    const result = await this.reviewService.update(id, userId, updateReviewDto);
    this.logger.log(`Review updated: ${id}`);
    return successResponse(result, 'Review updated successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @DeleteReviewDecorator()
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Deleting review: ${id} for user: ${userId}`);
    const result = await this.reviewService.remove(id, userId);
    this.logger.log(`Review deleted: ${id}`);
    return successResponse(result, 'Review deleted successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Delete('admin/:id')
  @AdminDeleteReviewDecorator()
  async removeByAdmin(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`Admin deleting review: ${id}`);
    const result = await this.reviewService.removeByAdmin(id);
    this.logger.log(`Review deleted by admin: ${id}`);
    return successResponse(result, 'Review deleted successfully');
  }
}
