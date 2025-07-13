import { UserRole } from '@/common/constants/user-roles.enum';
import { VALIDATION } from '@/common/constants/validation';
import { RefreshTokenService } from '@/refresh-token/refresh-token.service';
import { UpdateUserDto } from '@/user/dto/update-user.dto';
import { User } from '@/user/entities/user.entity';
import { UserService } from '@/user/user.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { RateLimitService } from './login-rate-limit.service';
import { CookieOptions, Request, Response } from 'express';
import { TooManyRequestsException } from './exceptions/too-many-requests.exception';
import { JwtService } from '@nestjs/jwt';
import { generateSecureKey } from '@/common/utils/generate-key.util';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './constants/limits';
import { TokenDto } from './dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly rateLimitService: RateLimitService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  public async registerUser(dto: RegisterDto): Promise<number> {
    const existingUser = await this.userService.getByEmail(dto.email);
    if (existingUser) {
      this.logger.warn(`Пользователь с email: ${dto.email} уже существует`);
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }

    const hashedPassword = await this.hashPassword(dto.password);
    dto.password = hashedPassword;

    const created = await this.userService.create(dto);
    this.logger.info(
      `Пользователь с email: ${dto.email} успешно зарегистрирован`,
    );

    return created;
  }

  public async login(
    req: Request,
    res: Response,
    dto: LoginDto,
  ): Promise<User> {
    const ip = req.ip;
    const { email, password } = dto;

    if (ip === undefined) {
      this.logger.error('IP адрес не определен при попытке входа');
      throw new BadRequestException('IP адрес не определен');
    }

    const isRateLimited = await this.rateLimitService.isLoginRateLimited(ip);
    if (isRateLimited) {
      throw new TooManyRequestsException();
    }

    const user = await this.userService.getByEmail(email);
    if (!user) {
      this.logger.error(`Пользователь с email: ${email} не найден. IP: ${ip}`);
      await this.rateLimitService.incrementLoginAttempts(ip);
      throw new BadRequestException('Неверный email или пароль');
    }
    const isPasswordValid = await this.validatePassword(user, password);
    if (!isPasswordValid) {
      this.logger.error(
        `Неверный пароль для пользователя с email: ${email}. IP: ${ip}`,
      );
      await this.rateLimitService.incrementLoginAttempts(ip);
      throw new BadRequestException(VALIDATION.LOGIN.ERROR_MESSAGE);
    }
    await this.rateLimitService.resetLoginAttempts(ip);

    if (user.isBlocked) {
      this.logger.warn(
        `Попытка входа заблокированного пользователя с email: ${email}. IP: ${ip}`,
      );
      throw new BadRequestException('Пользователь заблокирован');
    }
    const session = generateSecureKey(32);
    const accessToken = await this.createToken(user, 'access', session);
    const refreshToken = await this.createToken(user, 'refresh', session);
    const csrfToken = generateSecureKey(32);

    await this.refreshTokenService.save(
      user.id,
      refreshToken,
      session,
      REFRESH_TOKEN_TTL,
    );

    await this.setTokenCookie(res, accessToken, 'access');
    await this.setTokenCookie(res, refreshToken, 'refresh');
    await this.setTokenCookie(res, csrfToken, 'csrf');

    this.logger.info(
      `Пользователь с email: ${dto.email} успешно вошел в систему. IP: ${ip}`,
    );

    return user;
  }

  public async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken === undefined) {
      this.logger.error('Отсутствует refresh token в cookies при выходе');
      throw new BadRequestException('Отсутствует refresh token в cookies');
    }

    let payload: TokenDto;
    try {
      payload = await this.jwtService.verifyAsync<TokenDto>(refreshToken, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        algorithms: [this.configService.getOrThrow('JWT_ALGORITHM')],
        audience: this.configService.getOrThrow('JWT_AUDIENCE'),
        issuer: this.configService.getOrThrow('JWT_ISSUER'),
      });
    } catch (error) {
      this.logger.error('Неверный refresh token при выходе. Ошибка:', {
        error,
      });
      throw new BadRequestException('Неверный refresh token');
    }
    const userId = payload.sub;
    const sessionId = payload.session;

    if (!userId || !sessionId) {
      this.logger.error('Неверный формат токена при выходе');
      throw new BadRequestException('Неверный формат токена');
    }

    await this.refreshTokenService.delete(userId, sessionId);
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('csrf_token', {
      httpOnly: false,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      sameSite: 'lax',
    });

    this.logger.info(
      `Пользователь с ID: ${userId} успешно вышел из системы, session: ${sessionId}`,
    );
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken === undefined) {
      this.logger.error(
        'Отсутствует refresh token в cookies при обновлении токена',
      );
      throw new BadRequestException('Отсутствует refresh token в cookies');
    }

    let payload: TokenDto;
    try {
      payload = await this.jwtService.verifyAsync<TokenDto>(refreshToken);
    } catch {
      this.logger.error('Неверный payload при обновлении refresh токена');
      throw new BadRequestException('Неверный refresh token');
    }
    const userId = payload.sub;
    const sessionId = payload.session;

    const isValid = await this.refreshTokenService.validate(
      userId,
      sessionId,
      refreshToken,
    );
    if (!isValid) {
      throw new BadRequestException('Неверный refresh token');
    }

    const isRateLimited = await this.refreshTokenService.isRateLimited(
      userId,
      sessionId,
    );
    if (isRateLimited) {
      this.logger.error(
        `Слишком много попыток обновления токена для пользователя с ID: ${userId} и session: ${sessionId}`,
      );
      throw new TooManyRequestsException();
    }

    await this.refreshTokenService.incrementRateLimit(
      userId,
      sessionId,
      REFRESH_TOKEN_TTL,
    );

    const user = await this.userService.getById(userId);

    const accessToken = await this.createToken(user, 'access', sessionId);
    const newRefreshToken = await this.createToken(user, 'refresh', sessionId);
    const csrfToken = generateSecureKey(32);

    await this.refreshTokenService.save(
      user.id,
      newRefreshToken,
      sessionId,
      REFRESH_TOKEN_TTL,
    );

    await this.refreshTokenService.resetRateLimit(userId, sessionId);

    await this.setTokenCookie(res, accessToken, 'access');
    await this.setTokenCookie(res, newRefreshToken, 'refresh');
    await this.setTokenCookie(res, csrfToken, 'csrf');

    this.logger.info(
      `Пользователь с ID: ${userId} успешно обновил токены, session: ${sessionId}`,
    );

    res.status(204).send();
  }

  public async updateUser(
    id: number,
    email?: string,
    password?: string,
    name?: string,
    role?: UserRole,
  ): Promise<User> {
    const user = await this.userService.getById(id);
    const updatedFields: UpdateUserDto = {};
    if (email !== undefined && email !== user.email) {
      const existingUser = await this.userService.getByEmail(email);
      if (existingUser && existingUser.id !== id) {
        this.logger.warn(
          `Данный email: ${email} уже используется другим пользователем`,
        );

        throw new BadRequestException(
          'Данный email уже используется другим пользователем',
        );
      }
      updatedFields.email = email;
    }
    if (password !== undefined) {
      const hashedPassword = await this.hashPassword(password);
      updatedFields.password = hashedPassword;
    }
    if (name !== undefined && name !== user.name) {
      updatedFields.name = name;
    }
    if (role !== undefined && role !== user.role) {
      updatedFields.role = role;
    }

    const updatedUser = await this.userService.update(id, updatedFields);

    this.logger.info(
      `Пользователь с ID: ${id} успешно обновлен, изменены поля: ${Object.keys(updatedFields).join(', ')}`,
    );
    return updatedUser;
  }

  public async blockUser(id: number): Promise<User> {
    return await this.userService.block(id);
  }

  public async unblockUser(id: number): Promise<User> {
    return await this.userService.unblock(id);
  }

  private async hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
  }

  private async validatePassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    return await compare(password, user.password);
  }

  private async createToken(
    user: User,
    type: 'access' | 'refresh',
    session: string,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        session,
        tokenType: type,
      },
      {
        expiresIn: type === 'access' ? '15m' : '7d',
        secret: this.configService.getOrThrow('JWT_SECRET'),
        algorithm: this.configService.getOrThrow('JWT_ALGORITHM'),
        audience: this.configService.getOrThrow('JWT_AUDIENCE'),
        issuer: this.configService.getOrThrow('JWT_ISSUER'),
      },
    );
  }

  private async setTokenCookie(
    res: Response,
    token: string,
    type: 'access' | 'refresh' | 'csrf',
  ): Promise<void> {
    const cookieOptions: CookieOptions = {
      httpOnly: type !== 'csrf' ? true : false,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge:
        type === 'access' || type === 'csrf'
          ? ACCESS_TOKEN_TTL * 1000
          : REFRESH_TOKEN_TTL * 1000,
    };
    res.cookie(`${type}_token`, token, cookieOptions);
  }
}
