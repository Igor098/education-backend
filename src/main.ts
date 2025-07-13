/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function bootstrap() {
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Backend сайта "JS-Тренажер"')
    .setDescription('Документация REST API')
    .setVersion('1.0')
    .build();
  const documentFactory = (): OpenAPIObject =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, documentFactory);

  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.use(helmet());
  app.useLogger(app.get(Logger));

  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));

  app.enableCors({
    origin: config.getOrThrow('ALLOWED_ORIGINS').split(','),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  app.setGlobalPrefix('api');

  await app.listen(config.get<number>('PORT') ?? 3000);
}

bootstrap();
