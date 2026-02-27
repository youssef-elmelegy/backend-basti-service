import {
  Controller,
  Post,
  Body,
  Param,
  Logger,
  UseGuards,
  Delete,
  Patch,
  Query,
  Get,
} from '@nestjs/common';
import { CurrentUser } from '@/common';
import { ApiTags } from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import {
  ToggleStatusDto,
  DeleteOneDto,
  UpdateQuantityDto,
  CreateAddonItemDto,
  CreateSweetItemDto,
  CreateCustomCakeItemDto,
  CreateFeaturedCakeItemDto,
  CreatePredesignedCakeItemDto,
  BulkDeleteDto,
  RegionQueryDto,
} from '../dto';
import {
  GetAllCartItemsDecorator,
  AddAddonToCartDecorator,
  AddSweetToCartDecorator,
  AddFeaturedCakeToCartDecorator,
  AddPredesignedCakeToCartDecorator,
  AddCustomCakeToCartDecorator,
  DeleteCartItemDecorator,
  BulkDeleteCartItemsDecorator,
  ToggleCartItemDecorator,
  UpdateCartItemQuantityDecorator,
} from '../decorators';
import { successResponse } from '@/utils';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Get()
  @GetAllCartItemsDecorator()
  async getAll(@CurrentUser('sub') userId: string, @Query() regionQueryDto: RegionQueryDto) {
    this.logger.debug(`Fetching cart items for user: ${userId}`);
    const result = await this.cartService.getAll(userId, regionQueryDto.regionId);
    this.logger.log(`Cart items fetched for user: ${userId}`);
    return successResponse(result, 'Cart items retrieved successfully');
  }

  @Post('addon')
  @AddAddonToCartDecorator()
  async addAddon(
    @Body() createCartItemDto: CreateAddonItemDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addAddon(userId, createCartItemDto);
    this.logger.log(`Cart item created`);
    return successResponse(result, 'Cart item added successfully');
  }

  @Post('sweet')
  @AddSweetToCartDecorator()
  async addSweet(
    @Body() createCartItemDto: CreateSweetItemDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addSweet(userId, createCartItemDto);
    this.logger.log(`Cart item created`);
    return successResponse(result, 'Cart item added successfully');
  }

  @Post('featured-cake')
  @AddFeaturedCakeToCartDecorator()
  async addFeaturedCake(
    @Body() createCartItemDto: CreateFeaturedCakeItemDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addFeaturedCake(userId, createCartItemDto);
    this.logger.log(`Cart item created`);
    return successResponse(result, 'Cart item added successfully');
  }

  @Post('predesigned-cake')
  @AddPredesignedCakeToCartDecorator()
  async addPredesignedCake(
    @Body() createCartItemDto: CreatePredesignedCakeItemDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addPredesignedCake(userId, createCartItemDto);
    this.logger.log(`Cart item created`);
    return successResponse(result, 'Cart item added successfully');
  }

  @Post('custom-cake')
  @AddCustomCakeToCartDecorator()
  async addCustomCake(
    @Body() createCartItemDto: CreateCustomCakeItemDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addCustomCake(userId, createCartItemDto);
    this.logger.log(`Cart item created`);
    return successResponse(result, 'Cart item added successfully');
  }

  @Delete(':id')
  @DeleteCartItemDecorator()
  async delete(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() deleteOneDto: DeleteOneDto,
  ) {
    this.logger.debug(`Deleting cart item: ${id}`);
    const result = await this.cartService.deleteCartItem(id, userId, deleteOneDto);
    this.logger.log(`Cart item deleted: ${id}`);
    return successResponse(result, 'Cart item deleted successfully');
  }

  @Post('bulk-delete')
  @BulkDeleteCartItemsDecorator()
  async bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Deleting cart items`);
    const result = await this.cartService.bulkDelete(userId, bulkDeleteDto);
    this.logger.log(`Cart items deleted`);
    return successResponse(result, 'Cart items deleted successfully');
  }

  @Patch('toggle/:id')
  @ToggleCartItemDecorator()
  async toggle(
    @Body() toggleStatusDto: ToggleStatusDto,
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Toggling cart item status: ${id}`);
    const result = await this.cartService.toggleCartItem(id, userId, toggleStatusDto);
    this.logger.log(`Cart item toggled: ${id}`);
    return successResponse(result, 'Cart item state updated successfully');
  }

  @Patch('quantity/:id')
  @UpdateCartItemQuantityDecorator()
  async quantity(
    @Body() updateQuantityDto: UpdateQuantityDto,
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Updating cart item quantity: ${id}`);
    const result = await this.cartService.updateQuantity(id, userId, updateQuantityDto);
    this.logger.log(`Cart item updated: ${id}`);
    return successResponse(result, 'Cart item quantity updated successfully');
  }
}
