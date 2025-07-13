import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthService } from './redis-health.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly redisHealth: RedisHealthService,
  ) {}

  @Get()
  @HealthCheck()
  public check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> =>
        this.db.pingCheck('database', { timeout: 300 }),
      async (): Promise<HealthIndicatorResult> =>
        this.redisHealth.pingCheck('redis', { timeout: 300 }),
      async (): Promise<HealthIndicatorResult> =>
        this.disk.checkStorage('storage', {
          path: 'D:\\',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
