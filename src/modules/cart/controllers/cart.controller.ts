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
  ToggleCartItemDto,
  UpdateQuantityDto,
  CreateAddonItemDto,
  CreateSweetItemDto,
  CreateCustomCakeItemDto,
  CreateFeaturedCakeItemDto,
  CreatePredesignedCakeItemDto,
  TypeQueryDto,
} from '../dto';
import {
  GetAllCartItemsDecorator,
  AddAddonToCartDecorator,
  AddSweetToCartDecorator,
  AddFeaturedCakeToCartDecorator,
  AddPredesignedCakeToCartDecorator,
  AddCustomCakeToCartDecorator,
  DeleteCartItemDecorator,
  ToggleCartItemDecorator,
  UpdateCartItemQuantityDecorator,
} from '../decorators';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Get()
  @GetAllCartItemsDecorator()
  async getAllCartItems(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Fetching cart items for user: ${userId}`);
    const result = await this.cartService.getAllCartItems(userId);
    this.logger.log(`Cart items fetched for user: ${userId}`);
    return result;
  }

  @Post('addon')
  @AddAddonToCartDecorator()
  async addAddonToCart(
    @Body() createCartItemDto: CreateAddonItemDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addAddonToCart(userId, createCartItemDto);
    this.logger.log(`Cart item created`);
    return result;
  }

  @Post('sweet')
  @AddSweetToCartDecorator()
  async addSweetToCart(
    @Body() createCartItemDto: CreateSweetItemDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addSweetToCart(userId, createCartItemDto);
    this.logger.log(`Cart item created`);
    return result;
  }

  @Post('featured-cake')
  @AddFeaturedCakeToCartDecorator()
  async addFeaturedCakeToCart(
    @Body() createCartItemDto: CreateFeaturedCakeItemDto,
    @CurrentUser('sub') userId: string,
    @Query() query: TypeQueryDto,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addFeaturedCakeToCart(userId, createCartItemDto, query);
    this.logger.log(`Cart item created`);
    return result;
  }

  @Post('predesigned-cake')
  @AddPredesignedCakeToCartDecorator()
  async addPredesignedCakeToCart(
    @Body() createCartItemDto: CreatePredesignedCakeItemDto,
    @CurrentUser('sub') userId: string,
    @Query() query: TypeQueryDto,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addPredesignedCakeToCart(
      userId,
      createCartItemDto,
      query,
    );
    this.logger.log(`Cart item created`);
    return result;
  }

  @Post('custom-cake')
  @AddCustomCakeToCartDecorator()
  async addCustomCakeToCart(
    @Body() createCartItemDto: CreateCustomCakeItemDto,
    @CurrentUser('sub') userId: string,
    @Query() query: TypeQueryDto,
  ) {
    this.logger.debug(`Adding to cart for user: ${userId}`);
    const result = await this.cartService.addCustomCakeToCart(userId, createCartItemDto, query);
    this.logger.log(`Cart item created`);
    return result;
  }

  @Delete(':id')
  @DeleteCartItemDecorator()
  async delete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Deleting cart item: ${id}`);
    const result = await this.cartService.deleteCartItem(id, userId);
    this.logger.log(`Cart item deleted: ${id}`);
    return result;
  }

  @Patch('toggle/:id')
  @ToggleCartItemDecorator()
  async toggle(
    @Body() toggleCartItemDto: ToggleCartItemDto,
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Toggling cart item status: ${id}`);
    const result = await this.cartService.toggleCartItem(id, userId, toggleCartItemDto);
    this.logger.log(`Cart item toggled: ${id}`);
    return result;
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
    return result;
  }
}
