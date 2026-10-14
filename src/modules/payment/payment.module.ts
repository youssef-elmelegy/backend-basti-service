import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { MasaratService } from './services/masarat.service';
import { TadawulService } from './services/tadawul.service';

import * as fs from 'node:fs';
import * as https from 'node:https';
import { HttpModule } from '@nestjs/axios';
import axios from 'axios';

import {
  MASARAT_TRADE_BANK,
  MASARAT_REPUBLIC_BANK,
  MASARAT_SAHARI_BANK,
} from './masarat.constants';

const MasaratHttpsAgent_TradeBank = new https.Agent({
  ca: fs.readFileSync('/app/certs/masarat_gateway/trade_bank/MASARATYUSURONLINECA.pem'),
  cert: fs.readFileSync('/app/certs/masarat_gateway/trade_bank/api.basty.ly.pem'),
  key: fs.readFileSync('/app/certs/masarat_gateway/api.basty.ly.key'),
});

const MasaratHttpsAgent_RepublicBank = new https.Agent({
  ca: fs.readFileSync('/app/certs/masarat_gateway/republic_bank/MASARATMUSRFYCAONLINE.pem'),
  cert: fs.readFileSync('/app/certs/masarat_gateway/republic_bank/api.basty.ly.pem'),
  key: fs.readFileSync('/app/certs/masarat_gateway/api.basty.ly.key'),
});

const MasaratHttpsAgent_SahariBank = new https.Agent({
  //!!!!!!!! change this to the correct certificate for Sahari bank when available
  ca: fs.readFileSync('/app/certs/masarat_gateway/trade_bank/MASARATYUSURONLINECA.pem'),
  cert: fs.readFileSync('/app/certs/masarat_gateway/trade_bank/api.basty.ly.pem'),
  key: fs.readFileSync('/app/certs/masarat_gateway/api.basty.ly.key'),
});

@Module({
  imports: [HttpModule],
  controllers: [PaymentController],
  providers: [
    MasaratService,
    TadawulService,
    {
      provide: MASARAT_TRADE_BANK,
      useValue: axios.create({
        baseURL: process.env.MASARAT_URL,
        httpsAgent: MasaratHttpsAgent_TradeBank,
        timeout: 15000,
      }),
    },
    {
      provide: MASARAT_REPUBLIC_BANK,
      useValue: axios.create({
        baseURL: process.env.MASARAT_URL,
        httpsAgent: MasaratHttpsAgent_RepublicBank,
        timeout: 15000,
      }),
    },
    {
      provide: MASARAT_SAHARI_BANK,
      useValue: axios.create({
        baseURL: process.env.MASARAT_URL,
        httpsAgent: MasaratHttpsAgent_SahariBank,
        timeout: 15000,
      }),
    },
  ],
})
export class PaymentModule {}
