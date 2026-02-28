import { CurrentUser } from '@/common';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Logger,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, AdminRoles, AdminRolesGuard, JwtWithAdminGuard } from '@/common/guards/';
import { ChangeOrderStatusDto, CreateOrderDto, AssignBakeryDto, RegionFilterDto } from '../dto';
import {
  AssignBakeryDecorator,
  CancelOrderDecorator,
  ChangeOrderStatusDecorator,
  GetAllOrdersDecorator,
  GetMyOrdersDecorator,
  GetOrderByIdDecorator,
  PlaceOrderDecorator,
  RefuseOrderDecorator,
  GetOrderByIdForUserDecorator,
} from '../decorators';
import { successResponse } from '@/utils';

@ApiTags('order')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new Logger(OrderController.name);

  @UseGuards(JwtAuthGuard)
  @Post('place')
  @PlaceOrderDecorator()
  async placeOrder(@CurrentUser('sub') userId: string, @Body() orderData: CreateOrderDto) {
    this.logger.debug(`processing order for user: ${userId}`);
    const result = await this.orderService.create(userId, orderData);
    this.logger.debug(`order placed for user: ${userId} with order id: ${result.id}`);
    return successResponse(result, 'Order placed successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @GetMyOrdersDecorator()
  async getMyOrders(@CurrentUser('sub') userId: string, @Query() { regionId }: RegionFilterDto) {
    this.logger.debug(`getting orders for user: ${userId}`);
    const result = await this.orderService.getOrdersForUser(userId, regionId);
    return successResponse(result, 'Orders retrieved successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get()
  @GetAllOrdersDecorator()
  async getAllOrders(@Query() { regionId }: RegionFilterDto) {
    this.logger.debug('getting all orders');
    const result = await this.orderService.getAllOrders(regionId);
    return successResponse(result, 'Orders retrieved successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders/:id')
  @GetOrderByIdForUserDecorator()
  async getOrderByIdForUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Query() { regionId }: RegionFilterDto,
  ) {
    this.logger.debug(`getting order by id: ${id}`);
    const result = await this.orderService.getOrderByIdForUser(id, userId, regionId);
    return successResponse(result, 'Order retrieved successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get(':id')
  @GetOrderByIdDecorator()
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() { regionId }: RegionFilterDto,
  ) {
    this.logger.debug(`getting order by id: ${id}`);
    const result = await this.orderService.getOrderById(id, regionId);
    return successResponse(result, 'Order retrieved successfully');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @CancelOrderDecorator()
  async cancelOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`canceling order: ${id}`);
    const result = await this.orderService.cancelOrder(id, userId);
    this.logger.debug(`order cancelled: ${id}`);
    return successResponse(result, 'Order cancelled successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Patch(':id/refuse')
  @RefuseOrderDecorator()
  async refuseOrder(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`refusing order: ${id}`);
    const result = await this.orderService.refuseOrder(id);
    this.logger.debug(`order refused: ${id}`);
    return successResponse(result, 'Order refused successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Patch(':id/assign-bakery')
  @AssignBakeryDecorator()
  async assignBakery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignBakeryDto: AssignBakeryDto,
  ) {
    this.logger.debug(`assigning bakery to order: ${id}`);
    const result = await this.orderService.assignToBakery(id, assignBakeryDto);
    this.logger.debug(`bakery assigned to order: ${id}`);
    return successResponse(result, 'Bakery assigned to order successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Patch(':id/status')
  @ChangeOrderStatusDecorator()
  async changeOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeOrderStatusDto: ChangeOrderStatusDto,
  ) {
    this.logger.debug(`changing order status: ${id}`);
    const result = await this.orderService.changeOrderStatus(id, changeOrderStatusDto);
    this.logger.debug(`order status changed: ${id} to ${changeOrderStatusDto.status}`);
    return successResponse(result, 'Order status updated successfully');
  }
}
