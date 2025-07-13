import {
  ForbiddenException,
  Injectable,
  CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Observable } from 'rxjs';
import { UserRole } from '@/common/constants/user-roles.enum';

@Injectable()
export class RoleGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();

    if (!roles.length) {
      return true;
    }

    const user = request.user;
    if (user?.role === undefined) {
      throw new ForbiddenException(
        'Пользователь не авторизован или роли не загружены',
      );
    }

    const userRoleName = user.role as UserRole;

    const hasRole = roles.includes(userRoleName);

    if (!hasRole) {
      throw new ForbiddenException(
        'У вас недостаточно прав для доступа к данному ресурсу.',
      );
    }
    return true;
  }
}
