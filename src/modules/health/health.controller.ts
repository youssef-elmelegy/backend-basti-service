import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { Public } from '@/common';

@ApiTags('App')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Liveness + DB readiness probe',
    description:
      'Pings the database and reports uptime. Used by Docker healthcheck and uptime monitors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returned regardless of DB state; check `db` field to distinguish ok/degraded',
  })
  async check() {
    const t0 = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      return {
        status: 'ok',
        db: 'ok',
        latencyMs: Date.now() - t0,
        uptimeSec: Math.round(process.uptime()),
      };
    } catch (err) {
      return {
        status: 'degraded',
        db: 'down',
        error: (err as Error).message,
        uptimeSec: Math.round(process.uptime()),
      };
    }
  }
}
