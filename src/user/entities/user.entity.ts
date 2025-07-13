import { UserRole } from '@/common/constants/user-roles.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  @Index('id_index')
  id: number;

  @Column({ type: 'varchar', length: 80 })
  @Index('email_index', { unique: true })
  email: string;

  @Column({ type: 'text' })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
