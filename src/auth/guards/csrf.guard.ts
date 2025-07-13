import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';

export class CsrfGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const csrfToken = request.cookies['csrf_token'];
    const csrfHeader = request.headers['x-csrf-token'];
    if (csrfToken === undefined || csrfHeader === undefined) {
      throw new ForbiddenException('CSRF токен отсутствует');
    }

    if (csrfToken !== csrfHeader) {
      throw new ForbiddenException('Неверный CSRF токен');
    }

    return true;
  }
}
