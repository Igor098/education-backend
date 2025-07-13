import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { hash, compare } from 'bcrypt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { REFRESH_TOKEN_LIMIT } from '@/auth/constants/limits';

@Injectable()
export class RefreshTokenService {
  public constructor(
    @InjectRedis() private readonly redisClient: Redis,
    @InjectPinoLogger(RefreshTokenService.name)
    private readonly logger: PinoLogger,
  ) {}

  public async save(
    userId: number,
    refreshToken: string,
    sessionId: string,
    expiresInSec: number,
  ): Promise<void> {
    const hashedRefreshToken = await hash(refreshToken, 12);

    await this.redisClient.set(
      `refresh_token:${userId}:${sessionId}`,
      hashedRefreshToken,
      'EX',
      expiresInSec,
    );
    this.logger.info(
      `Сохранен refresh token для пользователя с ID: ${userId}, session: ${sessionId}`,
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
      this.logger.error('Ошибка валидации refresh token при обновлении токена');
      return false;
    }
    return await compare(refreshToken, hashedRefreshToken);
  }

  public async delete(userId: number, sessionId: string): Promise<void> {
    await this.redisClient.del(`refresh_token:${userId}:${sessionId}`);
    this.logger.info(
      `Удален refresh token для пользователя с ID: ${userId} и session: ${sessionId}`,
    );
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
    this.logger.info(
      `Количество попыток обновления токена пользователя с ID: ${userId} и session: ${sessionId}`,
      currentCount,
    );

    if (currentCount >= REFRESH_TOKEN_LIMIT) {
      this.logger.warn(
        `Пользователь с ID: ${userId} и session: ${sessionId} превысил лимит попыток обновления токена`,
      );
    }
    return currentCount >= REFRESH_TOKEN_LIMIT;
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
      this.logger.info(
        `Установлен таймер для ключа ${key} с истечением через ${expiresInSec} секунд`,
      );
    }
  }
  public async resetRateLimit(
    userId: number,
    sessionId: string,
  ): Promise<void> {
    const key = `refresh_attempts:${userId}:${sessionId}`;
    await this.redisClient.del(key);
    this.logger.info(`Сброшен таймер для ключа ${key}`);
  }
}
