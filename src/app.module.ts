import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import AppDataSource from './database/data-source/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level:
            config.getOrThrow<string>('NODE_ENV') === 'production'
              ? 'info'
              : 'debug',
          transport:
            config.getOrThrow<string>('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const transactionalDataSource =
          addTransactionalDataSource(AppDataSource);
        await transactionalDataSource.initialize();
        return transactionalDataSource.options;
      },
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
        secretOrPrivateKey: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN'),
          algorithm: config.getOrThrow('JWT_ALGORITHM'),
          audience: config.getOrThrow<string>('JWT_AUDIENCE'),
          issuer: config.getOrThrow<string>('JWT_ISSUER'),
        },
      }),
    }),
    HealthModule,
    RefreshTokenModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
