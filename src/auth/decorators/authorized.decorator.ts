import { type User } from '@/user/entities/user.entity';
import {
  createParamDecorator,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';

export const Authorized = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (user === undefined) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    return Boolean(data) ? user[data] : user;
  },
);
