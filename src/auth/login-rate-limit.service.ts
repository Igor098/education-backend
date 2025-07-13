import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  INVALID_TOKEN_ATTEMPTS_LIMIT,
  INVALID_TOKEN_ATTEMPTS_TTL,
  LOGIN_ATTEMPTS_LIMIT,
  LOGIN_ATTEMPTS_TTL,
} from './constants/limits';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class RateLimitService {
  public constructor(
    @InjectRedis() private readonly redisClient: Redis,
    @InjectPinoLogger(RateLimitService.name)
    private readonly logger: PinoLogger,
  ) {}

  public async isLoginRateLimited(ip: string): Promise<boolean> {
    const value = await this.redisClient.get(`login_attempts:${ip}`);
    if (value === null) {
      return false;
    }

    const currentCount = parseInt(value, 10);
    this.logger.info(`Текущие попытки входа для IP: ${ip} - ${currentCount}`);

    if (currentCount >= LOGIN_ATTEMPTS_LIMIT) {
      this.logger.warn(
        `Превышен лимит попыток входа для IP: ${ip}, текущий счетчик: ${currentCount}`,
      );
    }
    return currentCount >= LOGIN_ATTEMPTS_LIMIT;
  }

  public async incrementLoginAttempts(ip: string): Promise<void> {
    const count = await this.redisClient.incr(`login_attempts:${ip}`);

    if (count === 1) {
      await this.redisClient.expire(`login_attempts:${ip}`, LOGIN_ATTEMPTS_TTL);
      this.logger.info(
        `Установлен таймер логина для IP: ${ip} с истечением через ${LOGIN_ATTEMPTS_TTL} секунд`,
      );
    }
  }

  public async resetLoginAttempts(ip: string): Promise<void> {
    await this.redisClient.del(`login_attempts:${ip}`);
    this.logger.info(`Сброшены попытки входа для IP: ${ip}`);
  }

  public async isInvalidTokenRateLimited(ip: string): Promise<boolean> {
    const value = await this.redisClient.get(
      `invalid_access_token_attempts:${ip}`,
    );
    if (value === null) {
      return false;
    }

    const currentCount = parseInt(value, 10);
    this.logger.info(
      `Текущие попытки с недействительным токеном для IP: ${ip} - ${currentCount}`,
    );

    if (currentCount >= INVALID_TOKEN_ATTEMPTS_LIMIT) {
      this.logger.warn(
        `Превышен лимит попыток с недействительным токеном для IP: ${ip}, текущий счетчик: ${currentCount}`,
      );
    }
    return currentCount >= INVALID_TOKEN_ATTEMPTS_LIMIT;
  }

  public async incrementInvalidTokenAttempts(ip: string): Promise<void> {
    const count = await this.redisClient.incr(
      `invalid_access_token_attempts:${ip}`,
    );

    if (count === 1) {
      await this.redisClient.expire(
        `invalid_access_token_attempts:${ip}`,
        INVALID_TOKEN_ATTEMPTS_TTL,
      );
      this.logger.info(
        `Установлен таймер для недействительного токена для IP: ${ip} с истечением через ${LOGIN_ATTEMPTS_TTL} секунд`,
      );
    }
  }

  public async resetInvalidTokenAttempts(ip: string): Promise<void> {
    await this.redisClient.del(`invalid_access_token_attempts:${ip}`);
    this.logger.info(
      `Сброшены попытки с недействительным токеном для IP: ${ip}`,
    );
  }
}
