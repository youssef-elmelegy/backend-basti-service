import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Public } from '@/common';
import { TadawulService } from '../services/tadawul.service';
import { MasaratService } from '../services/masarat.service';
import { ConfirmPaymentWebhookDto, TadawulInitiatePaymentDto } from '../dto/tadawul.dto';
import { MasaratOpenSessionDto, MasaratCompleteSessionDto } from '../dto/masarat.dto';
import {
  InitiatePaymentDecorator,
  GetTransactionReceiptDecorator,
  ConfirmPaymentDecorator,
} from '../decorators/tadawul.decorator';
import { CompleteSessionDecorator, OpenSessionDecorator } from '../decorators/masarat.decorator';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly tadawulService: TadawulService,
    private readonly masaratService: MasaratService,
  ) {}

  @ApiTags('payment - tadawul')
  @Post('tadawul/initiate/:orderId')
  @UseGuards(JwtAuthGuard)
  @InitiatePaymentDecorator()
  async initiatePayment(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Body() { successUrl, failureUrl }: TadawulInitiatePaymentDto,
  ) {
    return await this.tadawulService.initiatePayment(orderId, userId, successUrl, failureUrl);
  }

  @ApiTags('payment - tadawul')
  @Post('tadawul/receipt/:orderId')
  @UseGuards(JwtAuthGuard)
  @GetTransactionReceiptDecorator()
  async getTransactionReceipt(@Param('orderId') orderId: string) {
    return await this.tadawulService.getTransactionReceipt(orderId);
  }

  @ApiTags('payment - tadawul')
  @Post('tadawul/webhook/confirm')
  @Public()
  @ConfirmPaymentDecorator()
  async confirmPayment(@Body() body: ConfirmPaymentWebhookDto) {
    return this.tadawulService.confirmPayment(body);
  }

  @ApiTags('payment - masarat')
  @Post('masarat/open-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @OpenSessionDecorator()
  async openSession(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Body() { cardNumber }: MasaratOpenSessionDto,
  ) {
    await this.masaratService.signin();
    return await this.masaratService.openSession(orderId, userId, cardNumber);
  }

  @ApiTags('payment - masarat')
  @Post('masarat/complete-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @CompleteSessionDecorator()
  async completeSession(
    @Body() { otp }: MasaratCompleteSessionDto,
    @Param('orderId') orderId: string,
  ) {
    return await this.masaratService.completeSession(otp, orderId);
  }
}
