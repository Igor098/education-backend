/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.getOrThrow('ALLOWED_ORIGINS').split(','),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  app.setGlobalPrefix('api');

  await app.listen(config.get<number>('PORT') ?? 3000);
}

bootstrap();
