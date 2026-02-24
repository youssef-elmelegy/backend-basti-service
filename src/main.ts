import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { env } from './env';

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
  const app = await NestFactory.create(AppModule);
  // Create app with logger configuration based on env.LOG_LEVEL
  app.useLogger(logLevelMap[env.LOG_LEVEL] || logLevelMap.info);

  app.setGlobalPrefix('api');

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
  const corsOrigins = env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : '*';
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    .build();

  const document = SwaggerModule.createDocument(app, config);

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
