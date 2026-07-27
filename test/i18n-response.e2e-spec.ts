import { Controller, Get, HttpStatus, Module, NotFoundException, Res } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import type { INestApplication } from '@nestjs/common';
import type { Response } from 'express';
import request from 'supertest';
import path from 'path';

import { I18nExceptionFilter } from '../src/common/filters/i18n-translation.filter';
import { I18nResponseInterceptor } from '../src/common/interceptors/i18n-transaltion.interceptor';
// Imported from the source file rather than the `src/utils` barrel: the barrel
// pulls in `@/db`, which needs a live DB and a path alias this config lacks.
import { successResponse } from '../src/utils/response.handler';

@Controller('probe')
class ProbeController {
  @Get('ok')
  ok() {
    return successResponse({ email: 'emad@basty.ly' }, 'routes.otp.sent', HttpStatus.OK);
  }

  @Get('fail')
  fail() {
    throw new NotFoundException('routes.admin.email_not_found');
  }

  // Mirrors the fixed admin-auth handlers that still need the response object
  // for cookies: `passthrough: true` keeps the returned value flowing through
  // the interceptor. Without it the handler writes the response itself and the
  // interceptor never runs, shipping the raw key (the reported bug).
  @Get('raw-res')
  rawRes(@Res({ passthrough: true }) res: Response) {
    res.cookie('probeCookie', 'set');
    return successResponse({ email: 'emad@basty.ly' }, 'routes.otp.sent', HttpStatus.OK);
  }
}

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: { path: path.join(__dirname, '../src/i18n'), watch: false },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
  ],
  controllers: [ProbeController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: I18nResponseInterceptor },
    { provide: APP_FILTER, useClass: I18nExceptionFilter },
  ],
})
class ProbeModule {}

describe('i18n response translation', () => {
  let app: INestApplication;

  // ts-jest compiles the Nest graph on first import, which comfortably exceeds
  // Jest's default 5s hook timeout on a cold run.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  });

  it('translates a success message to English', async () => {
    const res = await request(app.getHttpServer()).get('/probe/ok').expect(200);

    expect(res.body.message).toBe('OTP sent to your email');
    // The interceptor must strip `args` once it has translated. Its presence
    // is the signature of the translation block being skipped entirely.
    expect(res.body).not.toHaveProperty('args');
  });

  it('translates a success message to Arabic via Accept-Language', async () => {
    const res = await request(app.getHttpServer())
      .get('/probe/ok')
      .set('Accept-Language', 'ar')
      .expect(200);

    expect(res.body.message).toBe('تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني');
  });

  it('never leaks a raw dotted translation key', async () => {
    const res = await request(app.getHttpServer()).get('/probe/ok').expect(200);

    expect(res.body.message).not.toMatch(/^routes\./);
  });

  it('translates thrown exception messages', async () => {
    const res = await request(app.getHttpServer()).get('/probe/fail').expect(404);

    expect(res.body.message).not.toMatch(/^routes\./);
  });

  // Regression for the reported bug: `@Res()`-based handlers bypassed the
  // interceptor entirely, shipping the raw key and a stray `args` object.
  it('translates handlers that take the response object via @Res()', async () => {
    const res = await request(app.getHttpServer()).get('/probe/raw-res').expect(200);

    expect(res.body.message).toBe('OTP sent to your email');
    expect(res.body).not.toHaveProperty('args');
  });

  // passthrough must not cost us the side effects the auth handlers rely on.
  it('still applies cookies set by a passthrough handler', async () => {
    const res = await request(app.getHttpServer()).get('/probe/raw-res').expect(200);

    expect(res.headers['set-cookie']?.join(';')).toContain('probeCookie=set');
  });

  it('translates @Res() handlers into Arabic too', async () => {
    const res = await request(app.getHttpServer())
      .get('/probe/raw-res')
      .set('Accept-Language', 'ar')
      .expect(200);

    expect(res.body.message).toBe('تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني');
  });
});
