// MUST be the first import: initializes Sentry/GlitchTip before any other module loads.
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { env } from './env';
import { SentryLogger } from './sentry-logger';
import { I18nExceptionFilter } from './common/filters/i18n-translation.filter';
import { I18nResponseInterceptor } from './common/interceptors/i18n-transaltion.interceptor';

// Map env log levels to NestJS logger levels
type NestLogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose' | 'fatal';
const logLevelMap: Record<string, NestLogLevel[]> = {
  silent: [],
  error: ['error'],
  warn: ['error', 'warn'],
  info: ['error', 'warn', 'log'],
  debug: ['error', 'warn', 'log', 'debug', 'verbose'],
};

async function bootstrap() {
  // bufferLogs lets us swap in our custom logger before any startup log lines are lost.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  // Custom logger: writes to stdout (default) AND forwards to GlitchTip Logs.
  const logger = new SentryLogger();
  logger.setLogLevels(logLevelMap[env.LOG_LEVEL] || logLevelMap.info);
  app.useLogger(logger);

  // Trust Caddy / Cloudflare so req.ip reflects the real client (via X-Forwarded-For).
  // Required for @nestjs/throttler to rate-limit by client IP instead of proxy IP.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  /*
    instead of replacing all response and exception messages with the i18n logic in 
    every single module, a filter and an interceptor are used to catch all messages
    and translate them using the i18n context 
  */
  app.useGlobalFilters(new I18nExceptionFilter());
  app.useGlobalInterceptors(new I18nResponseInterceptor());

  //   /*
  //     instead of using the default validation pipe, a custom pipe is used to
  //     translate the error messages using the i18n context
  //   */
  //   app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     // Tell NestJS to throw the raw validation error objects
  //     exceptionFactory: (validationErrors) => {
  //       return new BadRequestException(validationErrors);
  //     },
  //   }),
  // );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure CORS for frontend clients
  // const corsOrigins = env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : '*';
  const corsOrigins = env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : '*';

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  const config = new DocumentBuilder()
    .setTitle('Basti API')
    .setDescription('API documentation for Basti application')
    .setVersion('0.0.1')
    .addTag('App', 'Application health and status')
    .addTag('auth', 'Authentication endpoints')
    .addTag('admin-auth', 'Admin authentication endpoints')
    .addTag('region', 'Region management endpoints')
    .addTag('bakery', 'Bakery management endpoints')
    .addTag('chef', 'Chef management endpoints')
    .addTag('featured-cakes', 'Featured cake management endpoints')
    .addTag('sweets', 'Sweet management endpoints')
    .addTag('addon', 'Addon management endpoints')
    .addTag('upload', 'File upload endpoints')
    .addTag('custom-cakes', 'Custom cake management endpoints')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      name: 'Accept-Language',
      required: false,
      description: 'Language preference',
      schema: {
        type: 'string',
        enum: ['en', 'ar'],
        default: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Protect the API docs with HTTP Basic Auth when credentials are configured.
  if (env.DOCS_USERNAME && env.DOCS_PASSWORD) {
    app.use('/api/docs', (req: Request, res: Response, next: NextFunction) => {
      const header = req.headers.authorization || '';
      const [scheme, encoded] = header.split(' ');

      if (scheme === 'Basic' && encoded) {
        const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
        if (user === env.DOCS_USERNAME && pass === env.DOCS_PASSWORD) {
          return next();
        }
      }

      res.set('WWW-Authenticate', 'Basic realm="API Docs"');
      return res.status(401).send('Authentication required.');
    });
  }

  app.use(
    '/api/docs',
    apiReference({
      theme: 'kepler',
      defaultHttpClient: { targetKey: 'js', clientKey: 'axios' },
      spec: {
        content: document,
      },
    }),
  );

  const port = env.PORT;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Log Level: ${env.LOG_LEVEL}`);
}

void bootstrap();
