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
import {
  TradeBankOpenSessionDecorator,
  TradeBankCompleteSessionDecorator,
  RepublicBankOpenSessionDecorator,
  RepublicBankCompleteSessionDecorator,
  SahariBankOpenSessionDecorator,
  SahariBankCompleteSessionDecorator,
} from '../decorators/masarat.decorator';

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
  @Post('masarat/yussor-pay/open-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @TradeBankOpenSessionDecorator()
  async tradeBankOpenSession(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Body() { cardNumber }: MasaratOpenSessionDto,
  ) {
    const data = await this.masaratService.signin('trade');
    return await this.masaratService.openSession(
      'trade',
      orderId,
      userId,
      cardNumber,
      data.data.content.value,
    );
  }

  @ApiTags('payment - masarat')
  @Post('masarat/yussor-pay/complete-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @TradeBankCompleteSessionDecorator()
  async tradeBankCompleteSession(
    @Body() { otp, token }: MasaratCompleteSessionDto,
    @Param('orderId') orderId: string,
  ) {
    return await this.masaratService.completeSession('trade', orderId, otp, token);
  }

  @ApiTags('payment - masarat')
  @Post('masarat/musrfy-pay/open-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @RepublicBankOpenSessionDecorator()
  async republicBankOpenSession(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Body() { cardNumber }: MasaratOpenSessionDto,
  ) {
    const data = await this.masaratService.signin('republic');
    return await this.masaratService.openSession(
      'republic',
      orderId,
      userId,
      cardNumber,
      data.data.content.value,
    );
  }

  @ApiTags('payment - masarat')
  @Post('masarat/musrfy-pay/complete-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @RepublicBankCompleteSessionDecorator()
  async republicBankCompleteSession(
    @Body() { otp, token }: MasaratCompleteSessionDto,
    @Param('orderId') orderId: string,
  ) {
    return await this.masaratService.completeSession('republic', orderId, otp, token);
  }

  @ApiTags('payment - masarat')
  @Post('masarat/sahari-pay/open-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @SahariBankOpenSessionDecorator()
  async sahariBankOpenSession(
    @Param('orderId') orderId: string,
    @CurrentUser('sub') userId: string,
    @Body() { cardNumber }: MasaratOpenSessionDto,
  ) {
    const data = await this.masaratService.signin('sahari');
    return await this.masaratService.openSession(
      'sahari',
      orderId,
      userId,
      cardNumber,
      data.data.content.value,
    );
  }

  @ApiTags('payment - masarat')
  @Post('masarat/sahari-pay/complete-session/:orderId')
  @UseGuards(JwtAuthGuard)
  @SahariBankCompleteSessionDecorator()
  async sahariBankCompleteSession(
    @Body() { otp, token }: MasaratCompleteSessionDto,
    @Param('orderId') orderId: string,
  ) {
    return await this.masaratService.completeSession('sahari', orderId, otp, token);
  }
}
