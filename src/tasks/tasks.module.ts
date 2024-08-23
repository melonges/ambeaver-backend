import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AssetsModule } from 'src/assets/assets.module';
import { PlayerModule } from 'src/player/player.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Task, TaskStatus } from './entities/task.entity';
import { CacheModule } from 'src/cache/cache.module';
import { TasksCache } from './tasks.cache';

@Module({
  imports: [
    AssetsModule,
    PlayerModule,
    MikroOrmModule.forFeature([Task, TaskStatus]),
    CacheModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksCache],
})
export class TasksModule {}
