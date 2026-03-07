import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('CORS');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    credentials: true,

    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        return callback(null, true);
      }

      if (
        requestOrigin === 'http://localhost:1420' || // dev desktop
        requestOrigin === 'http://localhost:3001' || // dev web
        requestOrigin === "http://172.232.249.173:3001" || // prod web
        requestOrigin === 'http://tauri.localhost' || // Windows production
        requestOrigin === 'tauri://localhost' || // macOS & Linux production
        requestOrigin.startsWith('tauri://') || // fallback Tauri
        requestOrigin.startsWith('file://') // fallback file protocol
      ) {
        callback(null, true);
      } else {
        logger.warn(`Blocked origin: ${requestOrigin}`); // ← log origin yang diblokir
        callback(new Error('Not allowed by CORS'));
      }
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
