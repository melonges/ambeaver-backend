import { CacheAdapter } from '@mikro-orm/core';

export class MemoryCacheAdapter implements CacheAdapter {
  constructor(private cacheService: CacheAdapter) {}
  get<T = any>(name: string): T | Promise<T | undefined> | undefined {
    return this.cacheService.get(name);
  }
  set(
    name: string,
    data: any,
    origin: string,
    expiration?: number,
  ): void | Promise<void> {
    return this.cacheService.set(name, data, origin, expiration);
  }
  remove(name: string): void | Promise<void> {
    return this.cacheService.remove(name);
  }
  clear(): void | Promise<void> {
    return this.cacheService.clear();
  }
}
