import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RedisHealthService } from './redis-health.service';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthService],
})
export class HealthModule {}
