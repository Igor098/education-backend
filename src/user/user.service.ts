import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { DeleteResponseDto } from '@/common/dto/delete-response.dto';
import { UserRole } from '@/common/constants/user-roles.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  public constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  public async create(email: string, password: string): Promise<void> {
    const user = this.userRepository.create({ email, password });
    await this.userRepository.save(user);
  }

  public async getByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  public async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  public async update(id: number, fields: UpdateUserDto): Promise<User> {
    const user = await this.getById(id);
    const { email, password, name, role } = fields;
    if (email !== undefined) {
      user.email = email;
    }
    if (password !== undefined) {
      user.password = password;
    }
    if (name !== undefined) {
      user.name = name;
    }
    if (role !== undefined) {
      user.role = role;
    }
    return this.userRepository.save(user);
  }

  public async block(id: number): Promise<User> {
    const user = await this.getById(id);

    if (user.isBlocked) {
      throw new BadRequestException('Пользователь уже заблокирован');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Невозможно заблокировать администратора');
    }

    user.isBlocked = true;
    return this.userRepository.save(user);
  }

  public async unblock(id: number): Promise<User> {
    const user = await this.getById(id);

    if (!user.isBlocked) {
      throw new BadRequestException('Пользователь не заблокирован');
    }

    user.isBlocked = false;
    return this.userRepository.save(user);
  }

  public async delete(id: number): Promise<DeleteResponseDto> {
    const user = await this.getById(id);
    const deletedId = user.id;

    await this.userRepository.delete(id);

    return {
      isDeleted: true,
      id: deletedId,
    };
  }
}
