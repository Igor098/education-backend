import type { UserRole } from '@/common/constants/user-roles.enum';

export class UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}
