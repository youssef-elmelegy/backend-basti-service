import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { successResponse, SuccessResponse } from '@/utils';
import { version } from '../package.json';

@Injectable()
export class AppService {
  getHello(): SuccessResponse<{ health: boolean; message: string; version: string }> {
    return successResponse(
      {
        health: true,
        message: 'Server is up and running',
        version,
      },
      'API is operational',
      HttpStatus.OK,
    );
  }
}
