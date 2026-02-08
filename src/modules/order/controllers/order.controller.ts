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
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, AdminRoles, AdminRolesGuard, FlexibleJwtGuard } from '@/common/guards/';
import { SuccessResponse } from '@/utils';
import { ChangeOrderStatusDto, CreateOrderDto, OrderResponseDto } from '../dto';
import {
  CancelOrderDecorator,
  ChangeOrderStatusDecorator,
  GetAllOrdersDecorator,
  GetMyOrdersDecorator,
  GetOrderByIdDecorator,
  PlaceOrderDecorator,
  RefuseOrderDecorator,
} from '../decorators';

// TODO: we need the assign order endpoint
@ApiTags('order')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new Logger(OrderController.name);

  @UseGuards(JwtAuthGuard)
  @Post('place')
  @PlaceOrderDecorator()
  async placeOrder(
    @CurrentUser('sub') userId: string,
    @Body() orderData: CreateOrderDto,
  ): Promise<SuccessResponse<OrderResponseDto>> {
    this.logger.debug(`processing order for user: ${userId}`);
    return this.orderService.create(userId, orderData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @GetMyOrdersDecorator()
  async getMyOrders(
    @CurrentUser('sub') userId: string,
  ): Promise<SuccessResponse<OrderResponseDto[]>> {
    this.logger.debug(`getting orders for user: ${userId}`);
    return this.orderService.getOrdersForUser(userId);
  }

  @UseGuards(AdminRolesGuard)
  @AdminRoles('admin')
  @UseGuards(JwtAuthGuard)
  @Get()
  @GetAllOrdersDecorator()
  async getAllOrders(): Promise<SuccessResponse<OrderResponseDto[]>> {
    this.logger.debug('getting all orders');
    return this.orderService.getAllOrders();
  }

  @UseGuards(FlexibleJwtGuard)
  @Get(':id')
  @GetOrderByIdDecorator()
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<SuccessResponse<OrderResponseDto>> {
    this.logger.debug(`getting order by id: ${id}`);
    return this.orderService.getOrderById(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @CancelOrderDecorator()
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<SuccessResponse<{ id: string; status: string }>> {
    this.logger.debug(`canceling order: ${id}`);
    return this.orderService.cancelOrder(id, userId);
  }

  @UseGuards(AdminRolesGuard)
  @AdminRoles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/refuse')
  @RefuseOrderDecorator()
  async refuseOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<{ id: string; status: string }>> {
    this.logger.debug(`refusing order: ${id}`);
    return this.orderService.refuseOrder(id);
  }

  @UseGuards(AdminRolesGuard)
  @AdminRoles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ChangeOrderStatusDecorator()
  async changeOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeOrderStatusDto: ChangeOrderStatusDto,
  ): Promise<SuccessResponse<{ id: string; status: string }>> {
    this.logger.debug(`changing order status: ${id}`);
    return this.orderService.changeOrderStatus(id, changeOrderStatusDto.status);
  }
}
