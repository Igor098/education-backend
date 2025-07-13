import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RoleGuard } from '@/auth/guards/roles.guard';
import type { UserRole } from '@/common/constants/user-roles.enum';
import { CsrfGuard } from '../guards/csrf.guard';

export function Authorization(...roles: UserRole[]): MethodDecorator {
  if (roles.length > 0) {
    return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RoleGuard));
  }

  return applyDecorators(UseGuards(AuthGuard));
}

export function MutationAuthorization(...roles: UserRole[]): MethodDecorator {
  if (roles.length > 0) {
    return applyDecorators(
      Roles(...roles),
      UseGuards(AuthGuard, RoleGuard, CsrfGuard),
    );
  }
  return applyDecorators(UseGuards(AuthGuard, CsrfGuard));
}
