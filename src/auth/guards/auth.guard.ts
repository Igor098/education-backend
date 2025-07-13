import { UserService } from '@/user/user.service';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  CanActivate,
  NotFoundException,
} from '@nestjs/common';
import { TokenDto } from '../dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RateLimitService } from '../login-rate-limit.service';

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(AuthGuard.name)
    private readonly logger: PinoLogger,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const ip = request.ip;

    const accessToken = request.cookies?.access_token;
    if (typeof accessToken === 'undefined') {
      this.logger.error('Отсутствует токен доступа в запросе');

      throw new UnauthorizedException(
        'Пользователь не авторизован. Пожалуйста войдите в систему.',
      );
    }

    const isRateLimited =
      await this.rateLimitService.isInvalidTokenRateLimited(ip);
    if (isRateLimited) {
      this.logger.warn(
        `IP ${ip} превысил лимит попыток входа. Доступ запрещён.`,
      );
      throw new UnauthorizedException(
        'Слишком много попыток с невалидным токеном доступа',
      );
    }

    let payload: TokenDto;

    try {
      payload = await this.jwtService.verifyAsync<TokenDto>(accessToken, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        algorithms: [this.configService.getOrThrow('JWT_ALGORITHM')],
        audience: this.configService.getOrThrow('JWT_AUDIENCE'),
        issuer: this.configService.getOrThrow('JWT_ISSUER'),
      });

      if (payload.tokenType !== 'access') {
        this.logger.error('Некорректный токен доступа', {
          userId: payload.sub,
        });
        throw new UnauthorizedException('Некорректный токен доступа');
      }
    } catch (err) {
      await this.rateLimitService.incrementInvalidTokenAttempts(ip);

      if (err.name === 'TokenExpiredError') {
        this.logger.warn('Истёк срок действия токена доступа', {
          error: err.message,
          userId: err.payload?.sub,
        });
        throw new UnauthorizedException('Срок действия токена истёк');
      }
      this.logger.error(`Ошибка валидации токена доступа, ${err}`, {
        error: err.message,
        userId: err.payload?.sub,
      });
      throw new UnauthorizedException('Ошибка валидации токена доступа');
    }

    try {
      const user = await this.userService.getById(payload.sub);
      request.user = user;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new UnauthorizedException('Пользователь не найден');
      }
      this.logger.error('Ошибка при получении пользователя из базы данных', {
        error: err,
        userId: payload.sub,
      });
      throw err;
    }
    await this.rateLimitService.resetInvalidTokenAttempts(ip);
    return true;
  }
}
