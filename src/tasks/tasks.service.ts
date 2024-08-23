import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Task,
  TaskStatus,
  TaskStatusEnum,
  TaskType,
} from './entities/task.entity';
import { TaskValidator } from './task.interface';
import { InviteTaskValidator } from './invite.task';
import { SubscribeTaskValidator } from './subscribe.task';
import { EntityManager } from '@mikro-orm/core';
import { AssetsService } from 'src/assets/assets.service';
import { TasksStatusRepository } from './tasks-status.repository';
import { Player } from 'src/player/entities/player.entity';
import { TasksRepository } from './tasks.repository';
import {
  PaginatedResponse,
  PaginationDto,
} from 'src/common/swagger/pagination';
import { CacheResult, TasksCache } from './tasks.cache';

@Injectable()
export class TasksService {
  readonly supportsStart: ReadonlyArray<TaskType> = [
    TaskType.SOCIAL_SUBSCRIPTION,
  ];
  constructor(
    private assetService: AssetsService,
    private tasksStatusRepository: TasksStatusRepository,
    private tasksRepository: TasksRepository,
    private em: EntityManager,
    private cache: TasksCache,
  ) {}

  async getTasks({
    page,
    perPage,
  }: PaginationDto): Promise<PaginatedResponse<Task>> {
    // TODO: add pagination with restrictions
    let tasks = await this.cache.getPaginatedTasksFromCache({ page, perPage });
    if (!tasks) {
      tasks = await this.tasksRepository.getTasks({ page, perPage });
      this.cache.cachePaginatedTasks(tasks);
    }
    return tasks;
  }

  checkTasksOnComplitionAndUpdate(player: Player, tasks: Task[]) {
    type TaskTuple = [task: Task, taskStatus: TaskStatusEnum | null];
    return tasks.map(async (task) => {
      const taskTuple: TaskTuple = [task, null];

      const taskStatusEnum = await this.getTaskStatus(player, task.id);

      // if task exists it means that task already READY_FOR_CLAIM or FINISHED
      if (taskStatusEnum) {
        taskTuple[1] = taskStatusEnum;
        return taskTuple;
      }

      if (this.supportsStart.includes(task.type)) return taskTuple;

      const shouldClaim = await this.validateTask(player, task);
      if (!shouldClaim) return taskTuple;
      taskTuple[1] = (await this.completeTask(player, task)).status;
      return taskTuple;
    });
  }

  async startTask(player: Player, taskId: number): Promise<TaskStatus> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundException();
    }

    if (!this.supportsStart.includes(task.type)) {
      throw new BadRequestException(
        `Task type ${task.type} is not supports start`,
      );
    }
    const taskStatus = await this.getTaskStatus(player, taskId);

    // if task exists it means that task already READY_FOR_CLAIM or FINISHED
    if (taskStatus) {
      throw new BadRequestException(`Task is already ${taskStatus} `);
    }

    const result = await this.validateTask(player, task);
    if (!result) {
      throw new BadRequestException('Task is not complete');
    }
    return this.completeTask(player, task);
  }

  async claimTask(player: Player, taskId: number) {
    const taskStatusEntity = await this.tasksStatusRepository.findOne(
      {
        task: taskId,
        player,
      },
      { populate: ['task'] },
    );

    if (!taskStatusEntity) {
      throw new NotFoundException();
    }
    if (taskStatusEntity.status !== TaskStatusEnum.READY_FOR_CLAIM) {
      throw new BadRequestException('Task is not ready to claim');
    }

    try {
      await this.em.begin();
      this.assetService.giveTaskReward(player, taskStatusEntity.task);
      taskStatusEntity.status = TaskStatusEnum.FINISHED;
      await this.em.commit();
    } catch (error) {
      await this.em.rollback();
      throw error;
    }
  }

  private taskTypeToTaskValidator(taskType: TaskType): TaskValidator {
    switch (taskType) {
      case TaskType.INVITE_FRIENDS:
        return new InviteTaskValidator();
      case TaskType.SOCIAL_SUBSCRIPTION:
        return new SubscribeTaskValidator();
    }
  }

  private validateTask(player: Player, task: Task): Promise<boolean> {
    const taskValidator = this.taskTypeToTaskValidator(task.type);
    return taskValidator.validateTask(player, task);
  }

  private async completeTask(player: Player, task: Task): Promise<TaskStatus> {
    const newTaskStatus = this.tasksStatusRepository.create({
      player,
      task,
      status: TaskStatusEnum.READY_FOR_CLAIM,
    });
    await Promise.all([
      this.em.persistAndFlush(newTaskStatus),
      this.cache.cacheTaskStatus(newTaskStatus),
    ]);
    return newTaskStatus;
  }

  private async getTaskStatus(player: Player, taskId: number) {
    // NOTE:  has benefits only if player has complete tasks more than unstarted
    const tasksStatus = await this.cache.getTaskStatusFromCache(
      player.id,
      taskId,
    );
    if (tasksStatus === CacheResult.MISS) {
      return;
    }
    if (!tasksStatus) {
      const tasksStatusEntity = await this.tasksStatusRepository.getTaskStatus(
        player,
        taskId,
      );
      if (tasksStatusEntity) {
        await this.cache.cacheTaskStatus(tasksStatusEntity);
      } else {
        await this.cache.cacheGetTaskStatusCacheMiss(player.id, taskId);
      }
    }
    return tasksStatus;
  }

  private async getTask(taskId: number) {
    let task = await this.cache.getTaskFromCache(taskId);
    if (task === CacheResult.MISS) {
      return;
    }
    if (!task) {
      task = (await this.tasksRepository.findOne(taskId)) as Task | undefined;
      if (task) {
        await this.cache.cacheTask(task);
      } else {
        await this.cache.cacheGetTaskCacheMiss(taskId);
      }
    }
    return task;
  }
}
