import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { isProductionEnv } from './common/security';

const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

// Production must name its frontend origins explicitly; credentials are never reflected to "*"
function resolveCorsOrigins(isProd: boolean): string[] {
  const configured = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter((o) => o && o !== '*');

  if (isProd) {
    if (configured.length === 0) {
      throw new Error('CORS_ORIGIN must list the frontend origin(s) in production.');
    }
    return configured;
  }
  return [...new Set([...configured, ...DEV_ORIGINS])];
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = isProductionEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Cloud Run sits behind one Google front end hop, so req.ip is the real client for rate limiting
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // 2. Security headers (CSP relaxed outside production so Swagger UI can load)
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
    }),
  );

  // 3. CORS with credentials, locked to known frontend origins
  app.enableCors({
    origin: resolveCorsOrigins(isProd),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 600,
  });

  // 4. Cookie parser middleware for session/refresh tokens
  app.use(cookieParser());

  // 5. Global ValidationPipe: unknown fields are rejected, one clear message per invalid field
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Swagger only outside production so the full route map is not public
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Smart AgriTech Core API')
      .setDescription(
        'Competition-grade Smart AgriTech backend microservice supporting AI vision diagnosis, outbreak mapping, and async BullMQ queue orchestration.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter your Bearer JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // 7. Bootstrap the app on port (defaults to 8080 in Cloud Run / container, 3000 locally)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Core API backend running on: http://0.0.0.0:${port}`);
  if (!isProd) {
    logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
