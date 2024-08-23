import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Task, TaskStatus, TaskStatusEnum } from './entities/task.entity';
import {
  PaginatedResponse,
  PaginationDto,
} from 'src/common/swagger/pagination';

export const enum CacheResult {
  MISS = 'miss',
}

@Injectable()
export class TasksCache {
  @Inject(CACHE_MANAGER) private cacheManager: Cache;

  invalidateTaskStatusCache(playerId: number, taskId: number) {
    return this.cacheManager.del(`taskstatus-${playerId}-${taskId}`);
  }

  getTaskStatusFromCache(playerId: number, taskId: number) {
    return this.cacheManager.get<TaskStatusEnum | CacheResult>(
      `taskstatus-${playerId}-${taskId}`,
    );
  }

  cacheTaskStatus({ player, task, status }: TaskStatus) {
    return this.cacheManager.set(
      `taskstatus-${player.id}-${task.id}`,
      status,
      86400000,
    );
  }

  getTaskFromCache(taskId: number) {
    return this.cacheManager.get<Task | CacheResult>(`task-${taskId}`);
  }
  cacheTask(task: Task) {
    return this.cacheManager.set(`task-${task.id}`, task, 86400000);
  }

  getPaginatedTasksFromCache(pagination: PaginationDto) {
    // TODO: add pagination with restrictions
    return this.cacheManager.get<PaginatedResponse<Task>>(
      `tasks-${pagination.page}-${pagination.perPage}`,
    );
  }

  cachePaginatedTasks(tasks: PaginatedResponse<Task>) {
    return this.cacheManager.set(
      `tasks-${tasks.meta.page}-${tasks.meta.perPage}`,
      tasks,
      86400000,
    );
  }

  cacheGetTaskStatusCacheMiss(playerId: number, taskId: number) {
    return this.cacheManager.set(
      `taskstatus-${playerId}-${taskId}`,
      CacheResult.MISS,
      86400000,
    );
  }

  cacheGetTaskCacheMiss(taskId: number) {
    return this.cacheManager.set(`task-${taskId}`, CacheResult.MISS, 86400000);
  }
}
