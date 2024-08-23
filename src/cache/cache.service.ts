import { CacheAdapter } from '@mikro-orm/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
@Injectable()
export class CacheService implements CacheAdapter {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  get<T = any>(name: string): T | Promise<T | undefined> | undefined {
    return this.cacheManager.get<T>(name);
  }
  set(
    name: string,
    data: any,
    _origin: string,
    expiration?: number,
  ): void | Promise<void> {
    return this.cacheManager.set(name, data, expiration);
  }
  remove(name: string): void | Promise<void> {
    return this.cacheManager.del(name);
  }
  clear(): void | Promise<void> {
    return this.cacheManager.reset();
  }
}
