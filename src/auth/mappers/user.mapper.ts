import type { User } from '@/user/entities/user.entity';
import type { UserResponseDto } from '../dto/user-response.dto';

export async function mapUserToDto(user: User): Promise<UserResponseDto> {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
    isActive: user.isActive,
    isBlocked: user.isBlocked,
  };
}
