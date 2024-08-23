import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { DatabaseConfig } from './database.types';
import { CacheService } from 'src/cache/cache.service';
import { MemoryCacheAdapter } from './cache.adapter';
import { CacheModule } from 'src/cache/cache.module';
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useFactory: (
        configService: ConfigService<DatabaseConfig>,
        cacheService: CacheService,
      ) => {
        return {
          entities: ['dist/**/*.entity.js'],
          entitiesTs: ['src/**/*.entity.ts'],
          metadataProvider: TsMorphMetadataProvider,
          host: configService.getOrThrow('POSTGRES_HOST'),
          port: configService.getOrThrow('POSTGRES_PORT'),
          user: configService.getOrThrow('POSTGRES_USER'),
          password: configService.getOrThrow('POSTGRES_PASSWORD'),
          dbName: configService.getOrThrow('POSTGRES_DB'),
          driver: PostgreSqlDriver,
          debug: process.env.NODE_ENV === 'development',
          resultCache: {
            adapter: MemoryCacheAdapter,
            options: { cacheService },
          },
        };
      },
      inject: [ConfigService, CacheService],
      imports: [ConfigModule, CacheModule],
    }),
    ConfigModule,
    CacheModule,
  ],
  exports: [MikroOrmModule],
  providers: [DatabaseService],
})
export class DatabaseModule {}
