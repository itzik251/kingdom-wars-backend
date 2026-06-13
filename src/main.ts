import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Restrict CORS to the game domain only
  const allowedOrigins = [
    'https://kingdomwars.cloud',
    'https://www.kingdomwars.cloud',
    // Allow local dev
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:3000'] : []),
  ];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Telegram WebApp, mobile)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false); // reject silently (don't crash)
      }
    },
    credentials: true,
  });

  // Serve React frontend as static files
  // index.html: no-cache so Telegram always loads the latest version
  // JS/CSS assets: long-lived cache (they have hashed filenames)
  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    setHeaders: (res, path) => {
      if (path.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Kingdom Wars API running on port ${port}`);
}

bootstrap();
