import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SuccessResponse } from '@/utils';
import { Public } from './common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns API version and server status',
  })
  @ApiResponse({
    status: 200,
    description: 'Server is running',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'API is operational' },
        data: {
          type: 'object',
          properties: {
            health: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Server is up and running' },
            version: { type: 'string', example: '0.0.1' },
          },
        },
        timestamp: { type: 'string', example: '2026-01-20T10:30:00Z' },
      },
    },
    example: {
      code: 200,
      success: true,
      message: 'API is operational',
      data: {
        health: true,
        message: 'Server is up and running',
        version: '0.0.1',
      },
      timestamp: '2026-01-20T10:30:00Z',
    },
  })
  getHello(): SuccessResponse<{ health: boolean; message: string; version: string }> {
    return this.appService.getHello();
  }
}
