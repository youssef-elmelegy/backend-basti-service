import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class AppService {
  getHello(): SuccessResponse<{ health: boolean; message: string }> {
    return successResponse(
      { health: true, message: 'Hello World!' },
      'Application is healthy',
      HttpStatus.OK,
    );
  }
}
