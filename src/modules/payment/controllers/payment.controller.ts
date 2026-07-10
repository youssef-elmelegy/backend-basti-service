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
    @Body() { successUrl, failureUrl, forcedPhoneNumber }: TadawulInitiatePaymentDto,
  ) {
    return await this.tadawulService.initiatePayment(
      orderId,
      userId,
      successUrl,
      failureUrl,
      forcedPhoneNumber,
    );
  }

  @ApiTags('payment - tadawul')
  @Post('tadawul/receipt/:ref')
  @UseGuards(JwtAuthGuard)
  @GetTransactionReceiptDecorator()
  async getTransactionReceipt(@Param('ref') ref: string) {
    return await this.tadawulService.getTransactionReceipt(ref);
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
    const data = await this.masaratService.signin();
    return await this.masaratService.openSession(
      orderId,
      userId,
      cardNumber,
      data.data.content.value,
    );
  }

  @ApiTags('payment - masarat')
  @Post('masarat/complete-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @CompleteSessionDecorator()
  async completeSession(
    @Body() { otp, token }: MasaratCompleteSessionDto,
    @Param('orderId') orderId: string,
  ) {
    return await this.masaratService.completeSession(orderId, otp, token);
  }
}
