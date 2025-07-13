import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';

interface RedisHealthOptions {
  timeout?: number;
  retries?: number;
}

@Injectable()
export class RedisHealthService {
  public constructor(@InjectRedis() private readonly redis: Redis) {}

  public async pingCheck(
    key: string,
    options: RedisHealthOptions,
  ): Promise<HealthIndicatorResult> {
    try {
      const { timeout = 1000, retries = 5 } = options;
      let attempts = 0;
      while (attempts < retries) {
        const res = await this.redis.ping();
        if (res === 'PONG') {
          return { [key]: { status: 'up' } };
        }
        attempts++;
        if (attempts < retries) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        }
      }
      return {
        [key]: { status: 'down', message: 'Failed to get PONG response' },
      };
    } catch (error) {
      return { [key]: { status: 'down', message: error.message } };
    }
  }
}
