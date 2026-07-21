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
  GetUnassignedOrdersQueryDto,
  GetAssignedOrdersQueryDto,
  GetCompletedOrdersQueryDto,
  GetDispatchOrdersQueryDto,
  GetBakeryOrdersQueryDto,
  AssignDriverDto,
  VerifyDeliveryCodeDto,
  OrderResponseDto,
  GetAllQueryDto,
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
  GetBakeryFinancialsDecorator,
  AssignDriverDecorator,
  VerifyDeliveryCodeDecorator,
  GenerateDeliveryCheckCodeDecorator,
} from '../decorators';
import { successResponse } from '@/utils';
import { SchedulerService } from '../services/scheduler.service';
import { FinancialsService } from '../services/financials.service';

@ApiTags('order')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly schedulerService: SchedulerService,
    private readonly financialsService: FinancialsService,
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
  async getMyOrders(@CurrentUser('sub') userId: string, @Query() query: GetAllQueryDto) {
    this.logger.debug(`getting orders for user: ${userId}`);
    const result = await this.orderService.getAll(userId, query, null, null, null, null);
    return successResponse(result.items, 'routes.orders.list_retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get()
  @GetAllOrdersDecorator()
  async getAllOrders(@Query() query: GetAllQueryDto) {
    this.logger.debug('getting all orders');
    const result = await this.orderService.getAll(null, query, null, null, null, null);
    return successResponse(result.items, 'routes.orders.list_retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('unassigned')
  async getUnassignedOrders(@Query() query: GetUnassignedOrdersQueryDto) {
    this.logger.debug(
      `getting unassigned orders (page=${query.page}, limit=${query.limit}, region=${query.regionId ?? '-'}, type=${query.type ?? '-'}, q=${query.q ?? '-'})`,
    );
    const result = await this.orderService.getAll(null, query, false, null, null, null);
    return successResponse(result, 'routes.orders.list_retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('assigned')
  async getAssignedOrders(@Query() query: GetAssignedOrdersQueryDto) {
    this.logger.debug(
      `getting assigned orders (q=${query.q ?? '-'}, statuses=${query.status?.join(',') ?? '-'})`,
    );
    const ungrouped = await this.orderService.getAll(null, query, true, null, null, null);

    // Group by bakeryId. `bakeryId` is non-null here thanks to the isNotNull filter.
    const result: Record<string, OrderResponseDto[]> = {};
    for (const order of ungrouped.items) {
      const key = order.bakeryId;
      if (!key) continue;
      if (!result[key]) result[key] = [];
      result[key].push(order);
    }

    return successResponse(result, 'routes.orders.list_retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('completed')
  async getCompletedOrders(@Query() query: GetCompletedOrdersQueryDto) {
    this.logger.debug(
      `getting completed orders (page=${query.page}, limit=${query.limit}, region=${query.regionId ?? '-'}, q=${query.q ?? '-'})`,
    );
    const result = await this.orderService.getAll(null, query, null, true, null, null);
    return successResponse(result, 'routes.orders.list_retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('dispatch')
  async getDispatchOrders(@Query() query: GetDispatchOrdersQueryDto) {
    this.logger.debug(
      `getting dispatch orders (page=${query.page}, limit=${query.limit}, region=${query.regionId ?? '-'}, bakery=${query.bakeryId ?? '-'}, driverState=${query.driverState ?? '-'}, q=${query.q ?? '-'})`,
    );
    const result = await this.orderService.getAll(null, query, null, null, true, null);
    return successResponse(result, 'routes.orders.list_retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin', 'manager')
  @Get('bakery/:bakeryId')
  @GetBakeryOrdersDecorator()
  async getBakeryOrders(
    @Param('bakeryId', ParseUUIDPipe) bakeryId: string,
    @Query() query: GetBakeryOrdersQueryDto,
  ) {
    this.logger.debug(
      `getting orders for bakery: ${bakeryId} (page=${query.page}, limit=${query.limit}, q=${query.q ?? '-'})`,
    );
    const result = await this.orderService.getAll(
      null,
      { ...query, bakeryId },
      null,
      null,
      null,
      true,
    );
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
    const result = await this.orderService.getOne(id, regionId, userId);
    return successResponse(result, 'routes.orders.retrieved');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get('financials')
  @GetOrdersFinancialsDecorator()
  async getOrdersFinancials(@Query() dto: GetOrdersFinancialsDto) {
    this.logger.debug('getting orders financials');
    return this.financialsService.getOrdersFinancials(dto);
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin', 'manager')
  @Get('bakery/:bakeryId/financials')
  @GetBakeryFinancialsDecorator()
  async getBakeryFinancials(
    @Param('bakeryId', ParseUUIDPipe) bakeryId: string,
    @Query() dto: GetOrdersFinancialsDto,
  ) {
    this.logger.debug(`getting financials for bakery: ${bakeryId}`);
    return this.financialsService.getOrdersFinancials({ ...dto, bakeryId });
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Get(':id/available-bakeries')
  async getAvailableBakeries(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`getting available bakeries for order: ${id}`);
    const result = await this.orderService.getAvailableBakeriesForOrder(id);
    return successResponse(result, 'routes.bakery.available_bakeries_fetched');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin', 'manager')
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

  @Post(':orderId/delivery-code')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('driver')
  @GenerateDeliveryCheckCodeDecorator()
  async generateDeliveryCheckCode(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') driverId: string,
  ) {
    this.logger.debug(`Driver ${driverId} generating delivery code for order: ${orderId}`);
    return this.orderService.generateDeliveryCheckCode(orderId, driverId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/verify-delivery-code')
  @VerifyDeliveryCodeDecorator()
  async verifyDeliveryCode(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() verifyDeliveryCodeDto: VerifyDeliveryCodeDto,
  ) {
    this.logger.debug(`verifying delivery code for order: ${id}`);
    const result = await this.orderService.verifyDeliveryCheckCode(
      id,
      userId,
      verifyDeliveryCodeDto,
    );
    this.logger.debug(`delivery code verified for order: ${id}`);
    return successResponse(result, 'routes.orders.delivered');
  }

  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @Patch(':id/assign-driver')
  @AssignDriverDecorator()
  async assignToDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDriverDto: AssignDriverDto,
  ) {
    this.logger.debug(`updating driver assignment for order: ${id}`);
    const result = await this.orderService.assignToDriver(id, assignDriverDto);
    this.logger.debug(`driver assignment updated for order: ${id}`);
    return successResponse(result, 'routes.orders.driver_assignment_updated');
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
    @CurrentUser('role') role: string,
    @Body() unassignBakeryDto?: UnassignBakeryDto,
  ) {
    // Platform admins can pull a still-pending order back to the unassigned pool
    // at any time; a bakery manager declining stays bound to the 1-hour window.
    const bypassTimeLimit = role === 'super_admin' || role === 'admin';
    this.logger.debug(`unassigning order from bakery: ${id} (bypassTimeLimit=${bypassTimeLimit})`);
    const result = await this.orderService.unassignFromBakery(id, unassignBakeryDto?.reason, {
      bypassTimeLimit,
    });
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
