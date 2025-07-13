import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RateLimitService } from './login-rate-limit.service';
import { UserService } from '@/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from '@/refresh-token/refresh-token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [
    AuthService,
    RateLimitService,
    UserService,
    JwtService,
    RefreshTokenService,
  ],
})
export class AuthModule {}
