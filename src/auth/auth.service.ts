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
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly rateLimitService: RateLimitService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  public async registerUser(email: string, password: string): Promise<void> {
    const existingUser = await this.userService.getByEmail(email);
    if (existingUser) {
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }

    await this.userService.create(email, password);
  }

  public async login(
    req: Request,
    res: Response,
    email: string,
    password: string,
  ): Promise<User> {
    const ip = req.ip;
    if (ip === undefined) {
      throw new BadRequestException('IP адрес не определен');
    }

    const isRateLimited = await this.rateLimitService.isLoginRateLimited(ip);
    if (isRateLimited) {
      throw new TooManyRequestsException();
    }

    const user = await this.userService.getByEmail(email);
    if (!user) {
      await this.rateLimitService.incrementLoginAttempts(ip);
      throw new BadRequestException('Неверный email или пароль');
    }
    const isPasswordValid = await this.validatePassword(user, password);
    if (!isPasswordValid) {
      await this.rateLimitService.incrementLoginAttempts(ip);
      throw new BadRequestException(VALIDATION.LOGIN.ERROR_MESSAGE);
    }
    await this.rateLimitService.resetLoginAttempts(ip);

    if (user.isBlocked) {
      throw new BadRequestException('Пользователь заблокирован');
    }
    const session = generateSecureKey(32);
    const accessToken = await this.createToken(user, 'access', session);
    const refreshToken = await this.createToken(user, 'refresh', session);

    await this.refreshTokenService.save(
      user.id,
      refreshToken,
      session,
      REFRESH_TOKEN_TTL,
    );

    await this.setTokenCookie(res, accessToken, 'access');
    await this.setTokenCookie(res, refreshToken, 'refresh');

    return user;
  }

  public async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken === undefined) {
      throw new BadRequestException('Отсутствует refresh token в cookies');
    }

    let payload: RefreshTokenDto;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new BadRequestException('Неверный refresh token');
    }
    const userId = payload.sub;
    const sessionId = payload.session;

    if (!userId || !sessionId) {
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
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken === undefined) {
      throw new BadRequestException('Отсутствует refresh token в cookies');
    }

    let payload: RefreshTokenDto;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
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

    await this.refreshTokenService.save(
      user.id,
      newRefreshToken,
      sessionId,
      REFRESH_TOKEN_TTL,
    );

    await this.refreshTokenService.resetRateLimit(userId, sessionId);

    await this.setTokenCookie(res, accessToken, 'access');
    await this.setTokenCookie(res, newRefreshToken, 'refresh');

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
        throw new BadRequestException(
          'Пользователь с таким email уже существует',
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
    return updatedUser;
  }

  public async blockUser(id: number): Promise<User> {
    return this.userService.block(id);
  }

  public async unblockUser(id: number): Promise<User> {
    return this.userService.unblock(id);
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
    return this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        session,
        tokenType: type,
      },
      { expiresIn: type === 'access' ? '15m' : '7d' },
    );
  }

  private async setTokenCookie(
    res: Response,
    token: string,
    type: 'access' | 'refresh',
  ): Promise<void> {
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge:
        type === 'access' ? ACCESS_TOKEN_TTL * 1000 : REFRESH_TOKEN_TTL * 1000,
    };
    res.cookie(`${type}_token`, token, cookieOptions);
  }
}
