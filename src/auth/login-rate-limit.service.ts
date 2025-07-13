import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { LOGIN_ATTEMPTS_LIMIT, LOGIN_ATTEMPTS_TTL } from './constants/limits';

@Injectable()
export class RateLimitService {
  public constructor(@InjectRedis() private readonly redisClient: Redis) {}

  public async isLoginRateLimited(ip: string): Promise<boolean> {
    const value = await this.redisClient.get(`login_attempts:${ip}`);
    if (value === null) {
      return false;
    }
    const currentCount = parseInt(value, 10);
    return currentCount >= LOGIN_ATTEMPTS_LIMIT;
  }

  public async incrementLoginAttempts(ip: string): Promise<void> {
    const count = await this.redisClient.incr(`login_attempts:${ip}`);

    if (count === 1) {
      await this.redisClient.expire(`login_attempts:${ip}`, LOGIN_ATTEMPTS_TTL);
    }
  }

  public async resetLoginAttempts(ip: string): Promise<void> {
    await this.redisClient.del(`login_attempts:${ip}`);
  }
}
