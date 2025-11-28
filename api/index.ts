import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { env } from '../src/env';

// Map env log levels to NestJS logger levels
type NestLogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose' | 'fatal';
const logLevelMap: Record<string, NestLogLevel[]> = {
  silent: [],
  error: ['error'],
  warn: ['error', 'warn'],
  info: ['error', 'warn', 'log'],
  debug: ['error', 'warn', 'log', 'debug', 'verbose'],
};

const expressApp = express();
let cachedApp: INestApplication | undefined;

async function createNestApp(): Promise<INestApplication> {
  if (!cachedApp) {
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter, {
      logger: logLevelMap[env.LOG_LEVEL] || logLevelMap.info,
    });

    app.setGlobalPrefix('api');

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

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

async function handler(req: Request, res: Response): Promise<void> {
  await createNestApp();
  expressApp(req, res);
}

export default handler;
