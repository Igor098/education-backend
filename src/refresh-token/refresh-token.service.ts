import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { hash, compare } from 'bcrypt';

@Injectable()
export class RefreshTokenService {
  public constructor(@InjectRedis() private readonly redisClient: Redis) {}

  public async save(
    userId: number,
    refreshToken: string,
    sessionId: string,
    expiresInSec: number,
  ): Promise<void> {
    const hashedRefreshToken = await hash(refreshToken, 10);
    await this.redisClient.set(
      `refresh_token:${userId}:${sessionId}`,
      hashedRefreshToken,
      'EX',
      expiresInSec,
    );
  }

  public async validate(
    userId: number,
    sessionId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const hashedRefreshToken = await this.redisClient.get(
      `refresh_token:${userId}:${sessionId}`,
    );
    if (hashedRefreshToken === null) {
      return false;
    }
    return await compare(refreshToken, hashedRefreshToken);
  }

  public async delete(userId: number, sessionId: string): Promise<void> {
    await this.redisClient.del(`refresh_token:${userId}:${sessionId}`);
  }

  public async isRateLimited(
    userId: number,
    sessionId: string,
  ): Promise<boolean> {
    const key = `refresh_attempts:${userId}:${sessionId}`;
    const value = await this.redisClient.get(key);
    if (value === null) {
      return false;
    }
    const currentCount = parseInt(value, 10);

    return currentCount >= 5;
  }

  public async incrementRateLimit(
    userId: number,
    sessionId: string,
    expiresInSec: number,
  ): Promise<void> {
    const key = `refresh_attempts:${userId}:${sessionId}`;
    const count = await this.redisClient.incr(key);
    if (count === 1) {
      await this.redisClient.expire(key, expiresInSec);
    }
  }
  public async resetRateLimit(
    userId: number,
    sessionId: string,
  ): Promise<void> {
    const key = `refresh_attempts:${userId}:${sessionId}`;
    await this.redisClient.del(key);
  }
}
