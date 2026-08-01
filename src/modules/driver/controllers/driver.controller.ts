import {
  Controller,
  Get,
  Logger,
  UseGuards,
  Param,
  Post,
  Body,
  Delete,
  Patch,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DriverService } from '../services/driver.service';
import { AdminRolesGuard } from '@/common/guards/admin-roles.guard';
import { JwtWithAdminGuard } from '@/common/guards/jwt-with-admin.guard';
import { AdminRoles } from '@/common/guards/admin-roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateReportDto } from '../dto';
import {
  CreateDriverDto,
  GetDriverOrdersHistoryQueryDto,
  GetDriverOrdersQueryDto,
  GetDriversQueryDto,
  GetReportsQueryDto,
  UpdateDriverDto,
} from '../dto';
import { UpdateDriverDueAmountDto } from '../dto';
import {
  BlockDriverEndpoint,
  CreateDriverEndpoint,
  DeleteDriverEndpoint,
  GetAllDriversDecorator,
  UpdateDriverEndpoint,
  UpdateDriverDueAmountEndpoint,
  GetDriverOrdersDecorator,
  AcceptDriverOrderDecorator,
  RefuseDriverOrderDecorator,
  GetOneDriverDecorator,
  ReportDriverDecorator,
  DeleteDriverReportDecorator,
  GetAllReportsDecorator,
  GetReportsListDecorator,
  GetDriverOrdersHistoryDecorator,
  ClientRefusedOrderDecorator,
  ClientNotRespondingDecorator,
} from '../decorators';
import { AdminAuthService } from '@/modules/admin-auth/services/admin-auth.service';
import { BlockAdminDto } from '@/modules/admin-auth/dto';

@ApiTags('drivers')
@Controller('drivers')
export class DriverController {
  private readonly logger = new Logger(DriverController.name);

  constructor(
    private readonly driverService: DriverService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @CreateDriverEndpoint()
  async create(@Body() createDriverDto: CreateDriverDto) {
    const { email } = createDriverDto;
    this.logger.debug(`Creating driver: ${email}`);

    const result = await this.adminAuthService.createAdmin({
      ...createDriverDto,
      role: 'driver',
    });

    const { data } = result as { data: { id: string } };
    this.logger.log(`Driver created: ${data.id}`);
    return result;
  }

  @Get()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @GetAllDriversDecorator()
  async findAll(@Query() query: GetDriversQueryDto) {
    this.logger.debug('Retrieving drivers');
    return this.driverService.findAll(query);
  }

  @Get('orders')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('driver')
  @GetDriverOrdersDecorator()
  async getDriversOrders(
    @CurrentUser('id') driverId: string,
    @Query() query: GetDriverOrdersQueryDto,
  ) {
    this.logger.debug(`Retrieving orders for driver: ${driverId}`);
    return this.driverService.getDriversOrders(driverId, query.isAssigned);
  }

  @Patch('orders/:orderId/accept')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('driver')
  @AcceptDriverOrderDecorator()
  async acceptOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') driverId: string,
  ) {
    this.logger.debug(`Driver ${driverId} accepting order: ${orderId}`);
    return this.driverService.acceptOrder(orderId, driverId);
  }

  @Patch('orders/:orderId/refuse')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('driver')
  @RefuseDriverOrderDecorator()
  async refuseOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') driverId: string,
  ) {
    this.logger.debug(`Driver ${driverId} refusing order: ${orderId}`);
    return this.driverService.refuseOrder(orderId, driverId);
  }

  @Get('reports')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @GetReportsListDecorator()
  async getReportsList(@Query() query: GetReportsQueryDto) {
    this.logger.debug('Retrieving all driver reports');
    return this.driverService.getAllReports(query);
  }

  @Get(':id')
  @GetOneDriverDecorator()
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Retrieving driver: ${id}`);
    return this.driverService.findOne(id);
  }

  @Get(':id/orders')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @GetDriverOrdersHistoryDecorator()
  async getDriverOrdersHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetDriverOrdersHistoryQueryDto,
  ) {
    this.logger.debug(`Retrieving order history for driver: ${id}`);
    return this.driverService.getDriverOrdersHistory(id, query);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ReportDriverDecorator()
  async report(
    @Param('id') driverId: string,
    @CurrentUser('id') userId: string,
    @Body() createReportDto: CreateReportDto,
  ) {
    this.logger.debug(`User ${userId} reporting driver ${driverId}`);
    return this.driverService.reportDriver(userId, driverId, createReportDto);
  }

  @Delete('reports/:id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @DeleteDriverReportDecorator()
  async deleteReport(@Param('id') id: string) {
    this.logger.debug(`Deleting report: ${id}`);
    return this.driverService.deleteReport(id);
  }

  @Patch(':id/block')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @BlockDriverEndpoint()
  async blockDriver(@Param('id', ParseUUIDPipe) id: string, @Body() blockDriverDto: BlockAdminDto) {
    const { isBlocked } = blockDriverDto;
    this.logger.debug(`Updating block status for driver: ${id}`);

    const result = await this.adminAuthService.blockAdmin(id, blockDriverDto);

    this.logger.log(`Driver block status updated: ${id} - blocked: ${isBlocked}`);
    return result;
  }

  @Patch(':id/update')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @UpdateDriverEndpoint()
  async updateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    this.logger.debug(`Updating driver: ${id}`);

    const result = await this.adminAuthService.updateAdmin(id, updateDriverDto);

    this.logger.log(`Driver updated: ${id}`);
    return result;
  }

  @Patch(':id/due-amount')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @UpdateDriverDueAmountEndpoint()
  async updateDriverDueAmount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDriverDueAmountDto: UpdateDriverDueAmountDto,
  ) {
    this.logger.debug(`Updating due amount for driver: ${id}`);

    const result = await this.driverService.updateDriverDueAmount(
      id,
      updateDriverDueAmountDto.dueAmount,
    );

    this.logger.log(`Driver due amount updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin')
  @DeleteDriverEndpoint()
  async deleteDriver(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.debug(`Deleting driver: ${id}`);

    const result = await this.adminAuthService.deleteAdmin(id);

    this.logger.log(`Driver deleted: ${id}`);
    return result;
  }

  @Get(':id/reports')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @GetAllReportsDecorator()
  async getDriverReports(
    @Param('id', ParseUUIDPipe) driverId: string,
    @Query() query: GetReportsQueryDto,
  ) {
    this.logger.debug(`Retrieving reports for driver: ${driverId}`);
    return this.driverService.getDriverReports(driverId, query);
  }

  @Post('orders/:orderId/client-refused-order')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('driver')
  @ClientRefusedOrderDecorator()
  async clientRefusedOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.driverService.cancelOrder(orderId, driverId, 'العميل رفض استلام الطلب');
  }

  @Post('orders/:orderId/client-not-responding')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('driver')
  @ClientNotRespondingDecorator()
  async clientNotResponding(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.driverService.cancelOrder(orderId, driverId, 'العميل لا يرد على المكالمات');
  }
}
