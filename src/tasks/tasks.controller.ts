import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiPaginatedResponse } from 'src/common/swagger/ApiPaginatedResponse';
import {
  PaginatedResponse,
  PaginationDto,
} from 'src/common/swagger/pagination';
import { TaskStatusEnumDto } from './dto/task-status-enum.dto';
import { TaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';
import { mapTaskStatusEnumToDto } from './tasks.utils';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlayerEntity } from 'src/common/decorators/player-entity.decorator';
import { Player } from 'src/player/entities/player.entity';
import { TaskType } from './entities/task.entity';
import { EnsureRequestContext } from '@mikro-orm/core';
import { TasksRepository } from './tasks.repository';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly tasksRepository: TasksRepository,
  ) {}

  @Get()
  @ApiPaginatedResponse(TaskDto)
  @EnsureRequestContext()
  async findAll(
    @PlayerEntity() player: Player,
    @Query() options: PaginationDto,
  ): Promise<PaginatedResponse<TaskDto>> {
    const { data: tasks, meta: tasksMeta } =
      await this.tasksRepository.getTasks(options);
    const arrayOfTaskStatusTuple = await Promise.all(
      this.tasksService.checkTasksOnComplitionAndUpdate(player, tasks),
    );
    return {
      data: arrayOfTaskStatusTuple.map(([task, status]) => ({
        id: task.id.toString(),
        title: task.title,
        type: task.type,
        status: status
          ? mapTaskStatusEnumToDto(status)
          : TaskStatusEnumDto.NOT_STARTED,
        rewardInAmbers: task.rewardInAmbers,
        meta:
          task.type === TaskType.SOCIAL_SUBSCRIPTION
            ? {
                url: task.meta.link as string,
              }
            : undefined,
      })),
      meta: tasksMeta,
    };
  }

  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  @Post('/start/:id')
  start(@PlayerEntity() player: Player, @Param('id') taskId: number) {
    return this.tasksService.startTask(player, taskId);
  }

  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  @Patch('/claim/:id')
  claim(@PlayerEntity() player: Player, @Param('id') taskId: number) {
    return this.tasksService.claimTask(player, taskId);
  }
}
