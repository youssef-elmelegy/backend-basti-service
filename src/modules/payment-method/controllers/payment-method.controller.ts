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
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PaymentMethodService } from '../services/payment-method.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../dto';
import {
  CreatePaymentMethodDecorator,
  GetAllPaymentMethodsDecorator,
  GetPaymentMethodByIdDecorator,
  UpdatePaymentMethodDecorator,
  DeletePaymentMethodDecorator,
} from '../decorators';

@ApiTags('payment-methods')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodController {
  private readonly logger = new Logger(PaymentMethodController.name);

  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @CreatePaymentMethodDecorator()
  async create(
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Creating payment method for user: ${userId}`);
    const result = await this.paymentMethodService.create(userId, createPaymentMethodDto);
    this.logger.log(`Payment method created for user: ${userId}`);
    return result;
  }

  @Get()
  @GetAllPaymentMethodsDecorator()
  async findAll(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Fetching all payment methods for user: ${userId}`);
    return this.paymentMethodService.findAll(userId);
  }

  @Get(':id')
  @GetPaymentMethodByIdDecorator()
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Fetching payment method: ${id} for user: ${userId}`);
    return this.paymentMethodService.findOne(id, userId);
  }

  @Patch(':id')
  @UpdatePaymentMethodDecorator()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Updating payment method: ${id} for user: ${userId}`);
    const result = await this.paymentMethodService.update(id, userId, updatePaymentMethodDto);
    this.logger.log(`Payment method updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @DeletePaymentMethodDecorator()
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Deleting payment method: ${id} for user: ${userId}`);
    const result = await this.paymentMethodService.remove(id, userId);
    this.logger.log(`Payment method deleted: ${id}`);
    return result;
  }
}
