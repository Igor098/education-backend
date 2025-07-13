import type { UserRole } from '@/common/constants/user-roles.enum';

export class RefreshTokenDto {
  sub: number;
  session: string;
  role: UserRole;
}
