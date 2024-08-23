import { EntityRepository, FilterQuery, FindOneOptions } from '@mikro-orm/core';
import { TaskStatus } from './entities/task.entity';
import { Player } from 'src/player/entities/player.entity';

export class TasksStatusRepository extends EntityRepository<TaskStatus> {
  getTaskStatus(
    filter: FilterQuery<TaskStatus>,
    options: FindOneOptions<TaskStatus> = { cache: 86400000 },
  ) {
    return this.findOne(filter, options);
  }

  async isTaskStatusExists(player: Player, taskId: number) {
    return (await this.count({ player, task: taskId })) > 0;
  }
}
