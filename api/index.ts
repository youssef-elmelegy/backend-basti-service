// Register tsconfig paths before any other imports
import 'tsconfig-paths/register';

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

const server = express();
let app: INestApplication | undefined;

async function bootstrap() {
  if (!app) {
    try {
      const expressAdapter = new ExpressAdapter(server);

      app = await NestFactory.create(AppModule, expressAdapter, {
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

      // Configure CORS
      const corsOrigins = env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : '*';
      app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      });

      await app.init();

      console.log('✅ NestJS app initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NestJS app:', error);
      throw error;
    }
  }

  return app;
}

export default async function handler(req: Request, res: Response) {
  try {
    await bootstrap();
    server(req, res);
  } catch (error) {
    console.error('❌ Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    });
  }
}
