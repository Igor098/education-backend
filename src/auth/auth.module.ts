import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RateLimitService } from './login-rate-limit.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RateLimitService],
})
export class AuthModule {}
