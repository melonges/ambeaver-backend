import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { Task } from './entities/task.entity';
import {
  PaginatedResponse,
  PaginationDto,
} from 'src/common/swagger/pagination';

export class TasksRepository extends EntityRepository<Task> {
  async getTasks({
    page,
    perPage,
  }: PaginationDto): Promise<PaginatedResponse<Task>> {
    const [tasks, count] = await this.findAndCount(
      {},
      { limit: perPage, offset: page * perPage, cache: 86400000 },
    );
    return {
      data: tasks,
      meta: {
        page,
        perPage,
        totalPages: Math.ceil(count / perPage),
        totalItems: count,
      },
    };
  }

  getTask(filter: FilterQuery<Task>) {
    return this.findOne(filter, { cache: 86400000 });
  }
}
