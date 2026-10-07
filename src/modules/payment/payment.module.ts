import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { MasaratService } from './services/masarat.service';
import { TadawulService } from './services/tadawul.service';

import * as fs from 'node:fs';
import * as https from 'node:https';
import { HttpModule } from '@nestjs/axios';

const httpsAgent = new https.Agent({
  ca: fs.readFileSync('/app/certs/MASARATYUSURONLINECA.pem'),
  cert: fs.readFileSync('/app/certs/api.basty.ly.pem'),
  key: fs.readFileSync('/app/certs/api.basty.ly.key'),
});

@Module({
  imports: [HttpModule.register({ httpsAgent })],
  controllers: [PaymentController],
  providers: [MasaratService, TadawulService],
})
export class PaymentModule {}
