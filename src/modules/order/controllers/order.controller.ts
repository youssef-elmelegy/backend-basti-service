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
  FinalizeOrderDto,
  GetOrdersFinancialsDto,
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
  FinalizeOrderDecorator,
  GetOrdersFinancialsDecorator,
} from '../decorators';
import { successResponse } from '@/utils';
import { SchedulerService } from '../services/scheduler.service';

@ApiTags('order')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly schedulerService: SchedulerService,
  ) {}
  private readonly logger = new Logger(OrderController.name);

  @UseGuards(JwtAuthGuard)
  @Post('place')
  @PlaceOrderDecorator()
  async placeOrder(@Body() orderData: CreateOrderDto, @CurrentUser('sub') userId: string) {
    this.logger.debug(`processing order`);
    const result = await this.orderService.create(orderData, userId);
    this.logger.debug(`order placed with order id: ${result.id}`);
    return successResponse(result, 'routes.orders.placed');
  }

  @Public()
  @Post('delivery-time')
  @GetDeliveryTimeDecorator()
  async getDeliveryTime(@Body() deliveryDateDto: GetDeliveryDateDto) {
    this.logger.debug(`getting delivery dates status`);
    const result = await this.schedulerService.getDeliveryDate(deliveryDateDto);
    this.logger.debug(`Retrived delivery dates status successfully`);
    return successResponse(result, 'routes.orders.delivery_dates_retrieved');
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @GetMyOrdersDecorator()
  async getMyOrders(@CurrentUser('sub') userId: string, @Query() { regionId }: RegionFilterDto) {
    this.logger.debug(`getting orders for user: ${userId}`);
    const result = await this.orderService.getAllForUser(userId, regionId);
    return successResponse(result, 'routes.orders.list_retrieved');
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
    const result = await this.orderService.getAll(regionId, statusArray);
    return successResponse(result, 'routes.orders.list_retrieved');
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
    const result = await this.orderService.getAllForBakery(bakeryId, regionId, statusArray);
    return successResponse(result, 'routes.orders.list_retrieved');
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
    const result = await this.orderService.getOneForUser(id, userId, regionId);
    return successResponse(result, 'routes.orders.retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('financials')
  @GetOrdersFinancialsDecorator()
  async getOrdersFinancials(@Query() dto: GetOrdersFinancialsDto) {
    this.logger.debug('getting orders financials');
    return this.orderService.getOrdersFinancials(dto);
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
    const result = await this.orderService.getOne(id, regionId);
    return successResponse(result, 'routes.orders.retrieved');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @CancelOrderDecorator()
  async cancelOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`canceling order: ${id}`);
    const result = await this.orderService.cancel(id, userId);
    this.logger.debug(`order cancelled: ${id}`);
    return successResponse(result, 'routes.orders.cancelled');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Patch(':id/refuse')
  @RefuseOrderDecorator()
  async refuseOrder(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`refusing order: ${id}`);
    const result = await this.orderService.refuse(id);
    this.logger.debug(`order refused: ${id}`);
    return successResponse(result, 'routes.orders.refused');
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
    return successResponse(result, 'routes.bakery.assigned_to_order');
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
    return successResponse(result, 'routes.orders.unassigned_from_bakery');
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
    const result = await this.orderService.changeStatus(id, changeOrderStatusDto);
    this.logger.debug(`order status changed: ${id} to ${changeOrderStatusDto.status}`);
    return successResponse(result, 'routes.orders.status_updated');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin', 'manager')
  @Patch(':orderId/qa')
  @FinalizeOrderDecorator()
  async finalizeOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() finalizeOrderDto: FinalizeOrderDto,
  ) {
    this.logger.debug(`finalizing order: ${orderId}`);
    const result = await this.orderService.finalizeData(orderId, finalizeOrderDto);
    this.logger.debug(`order finalized: ${orderId}`);
    return successResponse(result, 'routes.orders.finalized');
  }
}
