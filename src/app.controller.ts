import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SuccessResponse } from '@/utils';
import { Public } from './common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): SuccessResponse<{ health: boolean; message: string }> {
    return this.appService.getHello();
  }
}
