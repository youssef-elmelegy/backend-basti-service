import { CurrentUser, Public } from '@/common';
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
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  AssignBakeryDto,
  UnassignBakeryDto,
  RegionFilterDto,
  GetDeliveryDateDto,
} from '../dto';
import {
  AssignBakeryDecorator,
  UnassignBakeryDecorator,
  CancelOrderDecorator,
  ChangeOrderStatusDecorator,
  GetAllOrdersDecorator,
  GetDeliveryTimeDecorator,
  GetMyOrdersDecorator,
  GetOrderByIdDecorator,
  PlaceOrderDecorator,
  RefuseOrderDecorator,
  GetOrderByIdForUserDecorator,
  GetBakeryOrdersDecorator,
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
  async placeOrder(@Body() orderData: CreateOrderDto, @CurrentUser('sub') userId: string) {
    this.logger.debug(`processing order`);
    const result = await this.orderService.create(orderData, userId);
    this.logger.debug(`order placed with order id: ${result.id}`);
    return successResponse(result, 'Order placed successfully');
  }

  @Public()
  @Post('delivery-time')
  @GetDeliveryTimeDecorator()
  async getDeliveryTime(@Body() deliveryDateDto: GetDeliveryDateDto) {
    this.logger.debug(`getting delivery dates status`);
    const result = await this.orderService.getDeliveryDate(deliveryDateDto);
    this.logger.debug(`Retrived delivery dates status successfully`);
    return successResponse(result, 'Retrived delivery dates status successfully');
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
  async getAllOrders(
    @Query('regionId') regionId?: string,
    @Query('status') status?: string | string[],
  ) {
    this.logger.debug('getting all orders');
    // Normalize status to array format
    const statusArray = status ? (Array.isArray(status) ? status : status.split(',')) : undefined;
    const result = await this.orderService.getAllOrders(regionId, statusArray);
    return successResponse(result, 'Orders retrieved successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin', 'manager')
  @Get('bakery/:bakeryId')
  @GetBakeryOrdersDecorator()
  async getBakeryOrders(
    @Param('bakeryId', ParseUUIDPipe) bakeryId: string,
    @Query('regionId') regionId?: string,
    @Query('status') status?: string | string[],
  ) {
    this.logger.debug(`getting orders for bakery: ${bakeryId}`);
    // Normalize status to array format
    const statusArray = status ? (Array.isArray(status) ? status : status.split(',')) : undefined;
    const result = await this.orderService.getBakeryOrders(bakeryId, regionId, statusArray);
    return successResponse(result, 'Bakery orders retrieved successfully');
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
  @AdminRoles('super_admin', 'admin', 'manager')
  @Patch(':id/unassign-bakery')
  @UnassignBakeryDecorator()
  async unassignBakery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() unassignBakeryDto?: UnassignBakeryDto,
  ) {
    this.logger.debug(`unassigning order from bakery: ${id}`);
    const result = await this.orderService.unassignFromBakery(id, unassignBakeryDto?.reason);
    this.logger.debug(`order unassigned from bakery: ${id}`);
    return successResponse(result, 'Order unassigned from bakery successfully');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin', 'manager')
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
