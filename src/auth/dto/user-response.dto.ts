import { UserRole } from '@/common/constants/user-roles.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ type: Number, default: 1 })
  id: number;

  @ApiProperty({ type: String, default: '8eDfA@example.com' })
  email: string;

  @ApiProperty({ type: String, default: 'user' })
  role: UserRole;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ type: Boolean, default: false })
  isBlocked: boolean;

  @ApiProperty({ type: String, default: null })
  name?: string | null;
}
