import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WishlistItemsService } from '../services/wishlist.service';
import { CreateWishlistItemDto, PaginationDto, SortDto } from '../dto';
import {
  CreateWishlistItemDecorator,
  GetAllWishlistItemsDecorator,
  GetWishlistItemDecorator,
  DeleteWishlistItemDecorator,
} from '../decorators/wishlist.decorator';
import { PaginationDecorator, SortDecorator } from '../decorators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SuccessResponse } from '@/utils';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistItemsController {
  private readonly logger = new Logger(WishlistItemsController.name);

  constructor(private readonly wishlistService: WishlistItemsService) {}

  @Post()
  @CreateWishlistItemDecorator()
  async create(@Body() createDto: CreateWishlistItemDto) {
    this.logger.debug(`Adding to wishlist for user: ${createDto.userId}`);
    const result = await this.wishlistService.create(createDto);
    this.logger.log(`Wishlist item created`);
    return result;
  }

  @Get()
  @GetAllWishlistItemsDecorator()
  @PaginationDecorator()
  @SortDecorator()
  async findAll(
    @Query() query: { pagination: PaginationDto; sort: SortDto },
    @Query('userId') userId?: string,
  ) {
    this.logger.debug('Retrieving wishlist items');
    return this.wishlistService.findAll(query.pagination, query.sort, userId);
  }

  @Get(':id')
  @GetWishlistItemDecorator()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`Retrieving wishlist item: ${id}`);
    return this.wishlistService.findOne(id);
  }

  @Delete(':id')
  @DeleteWishlistItemDecorator()
  async remove(@Param('id') id: string): Promise<SuccessResponse<{ message: string }>> {
    this.logger.debug(`Deleting wishlist item: ${id}`);
    const result = await this.wishlistService.remove(id);
    this.logger.log(`Wishlist item deleted: ${id}`);
    return result;
  }
}
