import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { CommunityModule } from './modules/community/community.module';
import { ChatModule } from './modules/chat/chat.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Global environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),

    // Global rate limit per client IP; stricter limits are set per route with @Throttle
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),

    // BullMQ Redis connection configuration with Upstash & TLS support
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || process.env.REDIS_URL;

        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            const isTls =
              parsed.protocol === 'rediss:' ||
              configService.get<string>('REDIS_TLS') === 'true' ||
              process.env.REDIS_TLS === 'true';

            return {
              connection: {
                host: parsed.hostname,
                port: parseInt(parsed.port || '6379', 10),
                username:
                  decodeURIComponent(parsed.username) ||
                  configService.get<string>('REDIS_USERNAME') ||
                  process.env.REDIS_USERNAME ||
                  undefined,
                password:
                  decodeURIComponent(parsed.password) ||
                  configService.get<string>('REDIS_PASSWORD') ||
                  process.env.REDIS_PASSWORD ||
                  undefined,
                tls: isTls ? {} : undefined,
                maxRetriesPerRequest: null,
              },
            };
          } catch {
            // fallback if URL parsing fails
          }
        }

        const isTls =
          configService.get<string>('REDIS_TLS') === 'true' ||
          process.env.REDIS_TLS === 'true';

        return {
          connection: {
            host:
              configService.get<string>('REDIS_HOST') ||
              process.env.REDIS_HOST ||
              'localhost',
            port: parseInt(
              configService.get<string>('REDIS_PORT') ||
                process.env.REDIS_PORT ||
                '6379',
              10,
            ),
            username:
              configService.get<string>('REDIS_USERNAME') ||
              process.env.REDIS_USERNAME ||
              undefined,
            password:
              configService.get<string>('REDIS_PASSWORD') ||
              process.env.REDIS_PASSWORD ||
              undefined,
            tls: isTls ? {} : undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),

    // Database & Domain Feature Modules
    PrismaModule,
    UsersModule,
    AuthModule,
    StorageModule,
    DiagnosisModule,
    CommunityModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
