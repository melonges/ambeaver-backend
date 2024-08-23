import './common/instrument';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TelegramModule } from './telegram/telegram.module';
import { PlayerModule } from './player/player.module';
import { ReferralModule } from './referral/referral.module';
import { DatabaseModule } from './database/database.module';
import { EventModule } from './event/event.module';
import { SettingsModule } from './settings/settings.module';
import { TasksModule } from './tasks/tasks.module';
import { AssetsModule } from './assets/assets.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    CacheModule,
    AuthModule,
    TelegramModule,
    PlayerModule,
    DatabaseModule,
    ReferralModule,
    AssetsModule,
    EventModule,
    SettingsModule,
    TasksModule,
  ],
})
export class AppModule {}
