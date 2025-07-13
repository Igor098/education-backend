import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        options: {
          host: config.get('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN'),
          algorithm: config.getOrThrow('JWT_ALGORITHM'),
          audience: config.getOrThrow<string>('JWT_AUDIENCE'),
          issuer: config.getOrThrow<string>('JWT_ISSUER'),
        },
      }),
    }),
    RefreshTokenModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
