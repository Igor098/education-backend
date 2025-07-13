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
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CreateUserDto } from './dto/register-user.dto';

@Injectable()
export class UserService {
  public constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectPinoLogger(UserService.name) private readonly logger: PinoLogger,
  ) {}
  public async create(dto: CreateUserDto): Promise<number> {
    const user = this.userRepository.create(dto);
    const created = await this.userRepository.save(user);
    this.logger.info(`Пользователь с email: ${dto.email} успешно создан`);

    return created.id;
  }

  public async getByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  public async getById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`Пользователь с ID: ${id} не найден`);
      throw new NotFoundException('Пользователь не найден');
    }
    this.logger.info(`Пользователь с ID: ${id} успешно найден`);
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

    const updatedUser = this.userRepository.save(user);
    this.logger.info(
      `Пользователь с ID: ${id} успешно обновлен, изменены поля: ${Object.keys(fields).join(', ')}`,
    );
    return updatedUser;
  }

  public async block(id: number): Promise<User> {
    const user = await this.getById(id);

    if (user.isBlocked) {
      this.logger.warn(`Пользователь с ID: ${id} уже заблокирован`);
      throw new BadRequestException('Пользователь уже заблокирован');
    }

    if (user.role === UserRole.ADMIN) {
      this.logger.error(
        `Попытка заблокировать администратора с ID: ${id}, email: ${user.email}`,
      );
      throw new ForbiddenException('Невозможно заблокировать администратора');
    }

    user.isBlocked = true;
    this.logger.info(`Пользователь с ID: ${id} успешно заблокирован`);
    return this.userRepository.save(user);
  }

  public async unblock(id: number): Promise<User> {
    const user = await this.getById(id);

    if (!user.isBlocked) {
      this.logger.warn(`Пользователь с ID: ${id} не заблокирован`);
      throw new BadRequestException('Пользователь не заблокирован');
    }

    user.isBlocked = false;
    this.logger.info(`Пользователь с ID: ${id} успешно разблокирован`);
    return this.userRepository.save(user);
  }

  public async delete(id: number): Promise<DeleteResponseDto> {
    const user = await this.getById(id);
    const deletedId = user.id;
    const deletedEmail = user.email;

    await this.userRepository.delete(id);
    this.logger.info(
      `Пользователь с ID: ${deletedId} и email: ${deletedEmail} успешно удален`,
    );

    return {
      isDeleted: true,
      id: deletedId,
    };
  }
}
