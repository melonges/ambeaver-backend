import { Module } from '@nestjs/common';
import type { RedisClientOptions } from 'redis';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheConfig } from './cache.types';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      useFactory: async (configService: ConfigService<CacheConfig>) => ({
        store: await redisStore({
          socket: {
            host: configService.getOrThrow('REDIS_HOST'),
            port: configService.getOrThrow('REDIS_PORT'),
          },
        }),
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
