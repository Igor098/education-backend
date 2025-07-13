import type { UserRole } from '@/common/constants/user-roles.enum';

export class TokenDto {
  sub: number;
  session: string;
  role: UserRole;
  audience?: string;
  issuer?: string;
  expiresIn?: number;
  tokenType: 'access' | 'refresh';
}
